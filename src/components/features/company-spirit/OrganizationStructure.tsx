"use client"
import { BranchResource } from "@/actions/company-spirit/branch.actions";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Building2, Edit, Landmark, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import BranchForm from "./BranchForm";
import { FieldSeparator } from "@/components/ui/field";
import OrgChart from "./OrgChart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DepartmentForm from "./DepartmentForm";
import { useRouter } from "next/navigation";

export default function OrganizationStructure({ branches }: { branches: BranchResource[] }) {
    const t = useTranslations()
    const router = useRouter();

    const [openCreateForm, setOpenCreateForm] = React.useState(false);
    const [openEditBranch, setOpenEditBranch] = React.useState(false);
    const [openCreateDepartmentForm, setOpenCreateDepartmentForm] = React.useState(false);

    const [activeBranchId, setActiveBranchId] = React.useState<string | undefined>(
        branches?.length > 0 ? String(branches[0].id) : undefined
    );

    const activeBranch = React.useMemo(() => {
        return branches?.find((b) => String(b.id) === String(activeBranchId)) || branches?.[0];
    }, [branches, activeBranchId]);

    const handleSuccess = () => {
        setOpenCreateForm(false);
        setOpenEditBranch(false);
        setOpenCreateDepartmentForm(false);

        router.refresh();
    };

    return (
        <React.Fragment>
            <Card>
                <CardHeader>
                    <CardTitle>{t('messages.org_structure.title')}</CardTitle>
                    <CardDescription>{t('messages.org_structure.description')}</CardDescription>
                    <CardAction>
                        <Button
                            onClick={() => setOpenCreateForm(true)}
                        >
                            {<Landmark className="w-4 h-4" />}
                            {t('messages.org_structure.add_new_branch')}
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    {
                        branches.length === 0 ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant='icon'>
                                        <Landmark className="w-4 h-4" />
                                    </EmptyMedia>
                                    <EmptyTitle>{t('messages.org_structure.no_branches')}</EmptyTitle>
                                    <EmptyDescription>{t('messages.org_structure.no_branches_description')}</EmptyDescription>
                                </EmptyHeader>
                                <EmptyContent>
                                    <Button variant='outline' onClick={() => setOpenCreateForm(true)}>
                                        {<Landmark className="w-4 h-4" />}
                                        {t('messages.org_structure.add_new_branch')}
                                    </Button>
                                </EmptyContent>
                            </Empty>

                        ) : (
                            <div>
                                <div className="w-full border-b">
                                    <Tabs
                                        value={activeBranch ? String(activeBranch.id) : undefined}
                                        onValueChange={(selectedId) => setActiveBranchId(selectedId)}
                                    >
                                        <TabsList variant={"line"}>
                                            {branches.map((child) => {
                                                return (
                                                    <TabsTrigger
                                                        key={child.id}
                                                        value={String(child.id)}
                                                        className={"px-3 cursor-pointer"}
                                                    >
                                                        <div className="w-full flex items-center gap-1">
                                                            {child.name_localized}
                                                        </div>
                                                    </TabsTrigger>
                                                );
                                            })}
                                        </TabsList>
                                    </Tabs>
                                </div>
                                {
                                    activeBranch?.departments && (
                                        <>
                                            {activeBranch?.departments?.length > 0 ? (
                                                <>
                                                    <div className="flex justify-end gap-2 my-2">
                                                        <Button variant='outline' size="sm" onClick={() => setOpenCreateDepartmentForm(true)}>{<Plus className="w-4 h-4" />} {t('messages.org_structure.add_new_department')}</Button>
                                                        <Button variant='outline' size="sm" onClick={() => setOpenEditBranch(true)}>{<Edit className="w-4 h-4" />} {t('messages.org_structure.edit_branch')}</Button>
                                                    </div>
                                                    <OrgChart departments={activeBranch.departments} />
                                                </>
                                            ) : (
                                                <Empty>
                                                    <EmptyHeader>
                                                        <EmptyMedia variant='icon'>
                                                            <Building2 className="w-4 h-4" />
                                                        </EmptyMedia>
                                                        <EmptyTitle>{t('messages.org_structure.no_departments')}</EmptyTitle>
                                                        <EmptyDescription>{t('messages.org_structure.no_departments_description')}</EmptyDescription>
                                                    </EmptyHeader>
                                                    <EmptyContent>
                                                        <Button variant='outline' onClick={() => setOpenCreateDepartmentForm(true)}>
                                                            {<Landmark className="w-4 h-4" />}
                                                            {t('messages.org_structure.add_new_department')}
                                                        </Button>
                                                    </EmptyContent>
                                                </Empty>
                                            )}
                                        </>
                                    )
                                }
                            </div>
                        )
                    }
                </CardContent>
            </Card>

            <Dialog open={openCreateForm} onOpenChange={setOpenCreateForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('messages.org_structure.add_new_branch')}</DialogTitle>
                        <DialogDescription>{t('messages.org_structure.add_new_branch_description')}</DialogDescription>
                    </DialogHeader>
                    <FieldSeparator />
                    <div className="max-h-[50vh] overflow-auto no-scrollbar">
                        <BranchForm onSuccess={handleSuccess} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={openCreateDepartmentForm} onOpenChange={setOpenCreateDepartmentForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('messages.org_structure.add_new_department')}</DialogTitle>
                        <DialogDescription>{t('messages.org_structure.add_new_department_description')}</DialogDescription>
                    </DialogHeader>
                    <FieldSeparator />
                    <div className="max-h-[50vh] overflow-auto no-scrollbar">
                        <DepartmentForm onSuccess={handleSuccess} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={openEditBranch} onOpenChange={setOpenEditBranch}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('messages.org_structure.edit_branch')}</DialogTitle>
                        <DialogDescription>{t('messages.org_structure.edit_branch_description')}</DialogDescription>
                    </DialogHeader>
                    <FieldSeparator />
                    <div className="max-h-[50vh] overflow-auto no-scrollbar">
                        <BranchForm initialData={activeBranch} onSuccess={handleSuccess} />
                    </div>
                </DialogContent>
            </Dialog>
        </React.Fragment>
    );
}