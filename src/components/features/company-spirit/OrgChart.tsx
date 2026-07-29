"use client";

import React, { memo } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    Node,
    Edge,
    NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Card, CardContent } from '@/components/ui/card';
import { DepartmentResource } from '@/actions/company-spirit/department.actions';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import DepartmentForm from './DepartmentForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldSeparator } from '@/components/ui/field';

export type DepartmentNodeType = Node<DepartmentResource, 'department'>;

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
            <Card className="w-[260px] relative overflow-visible  " dir={dir}>
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
export default function OrgChart({ departments = [] }: { departments?: DepartmentResource[] }) {
    const { nodes: initialNodes, edges: initialEdges } = React.useMemo(() => {
        return transformDepartmentsToFlow(departments);
    }, [departments]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    React.useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    return (
        <Card className="w-full h-screen bg-background rounded-lg overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
            >
                <Controls />
                <Background color="var(--border)" gap={25} size={1} />
            </ReactFlow>
        </Card>
    );
}