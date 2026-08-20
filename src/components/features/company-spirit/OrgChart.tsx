"use client";

import React, { memo } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    useReactFlow,
    Handle,
    Position,
    Node,
    Edge,
    NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Card, CardContent } from '@/components/ui/card';
import { DepartmentResource, updateDepartment } from '@/actions/company-spirit/department.actions';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Edit, GripVertical, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import DepartmentForm from './DepartmentForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldSeparator } from '@/components/ui/field';

type DepartmentNodeData = DepartmentResource & {
    isDropTarget?: boolean;
    isInvalidDropTarget?: boolean;
};

export type DepartmentNodeType = Node<DepartmentNodeData, 'department'>;

const DRAG_HANDLE_CLASS = 'org-node-drag-handle';

// -------------------------------------------------------------
// 1. Custom Node Component
// -------------------------------------------------------------
const DepartmentNode = memo(({ data }: NodeProps<DepartmentNodeType>) => {
    const t = useTranslations();
    const locale = useLocale();
    const dir = locale === 'ar' ? 'rtl' : 'ltr';

    const [openDepartmentForm, setOpenDepartmentForm] = React.useState(false);

    const branchName =
        data.branch?.name_localized ||
        (typeof data.branch?.name === 'object'
            ? data.branch?.name?.ar || data.branch?.name?.en
            : data.branch?.name);

    const departmentName =
        data.name_localized ||
        data.name?.ar ||
        data.name?.en ||
        t('messages.org_structure.unnamed_department', { defaultValue: 'قسم بدون اسم' });

    return (
        <React.Fragment>
            <Card
                className={`group w-[260px] relative overflow-visible transition-colors ${data.isDropTarget
                    ? 'ring-2 ring-primary border-primary'
                    : data.isInvalidDropTarget
                        ? 'ring-2 ring-destructive border-destructive'
                        : ''
                    }`}
                dir={dir}
            >
                {/* Drag handle (shown on hover) */}
                <div
                    className={`${DRAG_HANDLE_CLASS} absolute -top-2 ${dir === 'rtl' ? '-right-2' : '-left-2'} z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing rounded-md border border-border bg-background shadow-sm p-1`}
                    title={t('messages.org_structure.drag_to_change_parent', {
                        defaultValue: 'اسحب لتغيير القسم الأب',
                    })}
                >
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                </div>

                {/* Point Top */}
                <Handle
                    type="target"
                    position={Position.Top}
                    className="opacity-0 border-0"
                />

                <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                        <Image
                            src={
                                data.manager?.avatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={departmentName}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover border border-border shadow-sm shrink-0 bg-slate-100"
                        />

                        <div className="flex-1 min-w-0">
                            <div className="flex gap-2 items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-card-foreground truncate">
                                        {departmentName}
                                    </h4>

                                    <p className="text-xs text-muted-foreground font-medium truncate">
                                        {data.manager
                                            ? `${data.manager.first_name} ${data.manager.last_name}`
                                            : t('messages.org_structure.without_manager_now')}
                                    </p>

                                    {branchName && (
                                        <span className="inline-block mt-1 text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium truncate max-w-full">
                                            {branchName}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col justify-center items-center text-muted-foreground shrink-0">
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => setOpenDepartmentForm(true)}
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button size="xs" variant="ghost">
                                        <Trash className="w-3.5 h-3.5 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/* Point Bottom */}
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="opacity-0 border-0"
                />
            </Card>

            <Dialog open={openDepartmentForm} onOpenChange={setOpenDepartmentForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('messages.org_structure.edit_department')}</DialogTitle>
                        <DialogDescription>{t('messages.org_structure.edit_department_description')}</DialogDescription>
                    </DialogHeader>
                    <FieldSeparator />
                    <div className="max-h-[50vh] overflow-auto no-scrollbar">
                        <DepartmentForm initialData={data} onSuccess={() => setOpenDepartmentForm(false)} />
                    </div>
                </DialogContent>
            </Dialog>
        </React.Fragment>
    );
});

DepartmentNode.displayName = 'DepartmentNode';

const nodeTypes = {
    department: DepartmentNode,
};

// -------------------------------------------------------------
// 2. Dagre Layout Helper (تحديث الأبعاد والمسافات)
// -------------------------------------------------------------
const NODE_WIDTH = 260;
const NODE_HEIGHT = 110; // تحديث الارتفاع الفعلي للكارت مع الـ padding

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    if (!nodes.length) return { nodes: [], edges: [] };

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // زيادة nodesep و ranksep لمساحات أنظف بين الصفوف والأعمدة
    dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 80 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes: Node[] = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - NODE_WIDTH / 2,
                y: nodeWithPosition.y - NODE_HEIGHT / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

const transformDepartmentsToFlow = (departments: DepartmentResource[] = []) => {
    const nodes: Node<DepartmentResource>[] = [];
    const edges: Edge[] = [];

    const visitedNodeIds = new Set<string>();
    const visitedEdgeIds = new Set<string>();

    const processDepartment = (dept: DepartmentResource) => {
        const nodeId = String(dept.id);

        if (!visitedNodeIds.has(nodeId)) {
            visitedNodeIds.add(nodeId);

            nodes.push({
                id: nodeId,
                type: 'department',
                data: dept,
                position: { x: 0, y: 0 },
                dragHandle: `.${DRAG_HANDLE_CLASS}`,
            });
        }

        if (dept.parent_id) {
            const edgeId = `e-${dept.parent_id}-${dept.id}`;
            if (!visitedEdgeIds.has(edgeId)) {
                visitedEdgeIds.add(edgeId);
                edges.push({
                    id: edgeId,
                    source: String(dept.parent_id),
                    target: String(dept.id),
                    type: 'step', // 👈 تم التغيير من smoothstep إلى step لخطوط قاطعة مستقيمة وبزوايا قائمة
                });
            }
        }

        if (Array.isArray(dept.children) && dept.children.length > 0) {
            dept.children.forEach(processDepartment);
        }
    };

    departments.forEach(processDepartment);

    return getLayoutedElements(nodes, edges);
};

// -------------------------------------------------------------
// 3. Main OrgChart Component
// -------------------------------------------------------------
function OrgChartFlow({ departments = [] }: { departments?: DepartmentResource[] }) {
    const t = useTranslations();
    const router = useRouter();
    const { getIntersectingNodes } = useReactFlow();

    const { nodes: initialNodes, edges: initialEdges } = React.useMemo(() => {
        return transformDepartmentsToFlow(departments);
    }, [departments]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    // كل الأبناء (المباشرين وغير المباشرين) لقسم معين — لمنع إسقاط القسم داخل أحد أبنائه
    const getDescendantIds = React.useCallback(
        (nodeId: string) => {
            const descendants = new Set<string>();
            const walk = (id: string) => {
                edges.forEach((edge) => {
                    if (edge.source === id && !descendants.has(edge.target)) {
                        descendants.add(edge.target);
                        walk(edge.target);
                    }
                });
            };
            walk(nodeId);
            return descendants;
        },
        [edges]
    );

    // أقرب عقدة متقاطعة صالحة كأب جديد
    const findDropTarget = React.useCallback(
        (draggedNode: Node) => {
            const forbidden = getDescendantIds(draggedNode.id);
            const intersections = getIntersectingNodes(draggedNode);

            const valid = intersections.find(
                (node) => node.id !== draggedNode.id && !forbidden.has(node.id)
            );
            if (valid) return { target: valid, valid: true as const };

            const invalid = intersections.find((node) => node.id !== draggedNode.id);
            return invalid ? { target: invalid, valid: false as const } : null;
        },
        [getIntersectingNodes, getDescendantIds]
    );

    const highlight = React.useCallback(
        (targetId: string | null, valid: boolean) => {
            setNodes((current) =>
                current.map((node) => {
                    const isDropTarget = valid && node.id === targetId;
                    const isInvalidDropTarget = !valid && node.id === targetId;

                    if (
                        !!node.data.isDropTarget === isDropTarget &&
                        !!node.data.isInvalidDropTarget === isInvalidDropTarget
                    ) {
                        return node;
                    }

                    return { ...node, data: { ...node.data, isDropTarget, isInvalidDropTarget } };
                })
            );
        },
        [setNodes]
    );

    const onNodeDrag = React.useCallback(
        (_: MouseEvent | TouchEvent, node: Node) => {
            const hit = findDropTarget(node);
            highlight(hit?.target.id ?? null, hit?.valid ?? false);
        },
        [findDropTarget, highlight]
    );

    const onNodeDragStop = React.useCallback(
        async (_: MouseEvent | TouchEvent, node: Node) => {
            const hit = findDropTarget(node);
            highlight(null, false);

            // بدون هدف صالح أو نفس الأب الحالي → رجّع التخطيط كما هو
            if (!hit?.valid || String((node.data as DepartmentNodeData).parent_id ?? '') === hit.target.id) {
                setNodes(initialNodes);
                return;
            }

            const newParentId = Number(hit.target.id);

            setIsSaving(true);
            const result = await updateDepartment(node.id, {
                name: {
                    en: (node.data as DepartmentNodeData).name?.en ?? '',
                    ar: (node.data as DepartmentNodeData).name?.ar ?? '',
                },
                parent_id: newParentId,
                branch_id: (node.data as DepartmentNodeData).branch_id ?? (node.data as DepartmentNodeData).branch?.id ?? null,
                manager_id: (node.data as DepartmentNodeData).manager_id ?? (node.data as DepartmentNodeData).manager?.id ?? null,
            });
            setIsSaving(false);

            if (!result.success) {
                toast.error(result.error);
                setNodes(initialNodes);
                return;
            }

            toast.success(result.data.message);
            router.refresh();
        },
        [findDropTarget, highlight, initialNodes, setNodes, router]
    );

    return (
        <Card className="w-full h-screen bg-background rounded-lg overflow-hidden relative">
            {isSaving && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 rounded-md bg-background border border-border shadow-sm px-3 py-1.5 text-xs text-muted-foreground">
                    {t('messages.saving', { defaultValue: 'جاري الحفظ...' })}
                </div>
            )}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDrag={onNodeDrag}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable
                nodesConnectable={false}
            >
                <Controls />
                <Background color="var(--border)" gap={25} size={1} />
            </ReactFlow>
        </Card>
    );
}

export default function OrgChart({ departments = [] }: { departments?: DepartmentResource[] }) {
    return (
        <ReactFlowProvider>
            <OrgChartFlow departments={departments} />
        </ReactFlowProvider>
    );
}