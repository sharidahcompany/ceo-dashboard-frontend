"use client"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { deleteGoal, GoalResource } from "@/actions/company-spirit/goal.actions";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Edit, Plus, Target, Trash, Sparkles } from "lucide-react";
import React from "react";
import GoalForm from "./GoalForm";
import GoalTimer from "./GoalTimer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { toast } from "sonner";
import { FieldSeparator } from "@/components/ui/field";
import { Can } from "@/providers/AbilityProvider";

export default function Goals({ goals }: { goals: GoalResource[] }) {
    const t = useTranslations();

    const [openCreateForm, setOpenCreateForm] = React.useState(false);
    const [openEditForm, setOpenEditForm] = React.useState(false);
    const [selectedGoal, setSelectedGoal] = React.useState<GoalResource | null>(null);

    const handleEdit = (goal: GoalResource) => {
        setSelectedGoal(goal);
        setOpenEditForm(true);
    };

    const closeEditForm = () => {
        setOpenEditForm(false);
        setSelectedGoal(null);
    };

    const handleDelete = async (id: number) => {
        const deleted = await deleteGoal([id]);
        if (deleted.success) {
            toast.success(t("messages.success"));
        } else {
            toast.error(deleted.error);
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>
                        {t('routes.goals')}
                    </CardTitle>
                    <CardDescription>
                        {t('messages.goals.description')}
                    </CardDescription>
                    <CardAction>
                        <Can I="create" a="workspace.goal">
                            <Button onClick={() => { setOpenCreateForm(true) }} className="gap-2">
                                <Plus className="h-4 w-4" />
                                {t('messages.goals.add_new_goal')}
                            </Button>
                        </Can>
                    </CardAction>
                </CardHeader>

                <CardContent>
                    {goals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {goals.map((goal) => (
                                <Card key={goal.id} className=" flex flex-col justify-between  ">
                                    <CardContent>
                                        {goal.media_url ? (
                                            <div className="relative w-full h-36 rounded-md overflow-hidden mb-3">
                                                <Image
                                                    src={goal.media_url}
                                                    alt={goal.title_localized}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 33vw"
                                                    className=" object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-36 rounded-md flex items-center justify-center bg-primary/5 text-primary mb-3">
                                                <Sparkles className="w-12 h-12 stroke-[1.5]" />
                                            </div>
                                        )}
                                        <h3 className="font-semibold">{goal.title_localized}</h3>
                                        <p className="text-sm text-muted-foreground">{goal.description_localized}</p>

                                        {goal.end_date && <GoalTimer endDate={goal.end_date} />}

                                        {/* Edit and Delete Buttons */}
                                        <div className="flex justify-end space-x-2 mt-3">
                                            <Can I="update" a="workspace.goal">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(goal)}>
                                                    <Edit />
                                                </Button>
                                            </Can>
                                            <Can I="delete" a="workspace.goal">
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(goal.id as number)}>
                                                    <Trash />
                                                </Button>
                                            </Can>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant={"icon"}>
                                    <Target className="h-4 w-4" />
                                </EmptyMedia>
                                <EmptyTitle>
                                    {t('messages.goals.no_goals')}
                                </EmptyTitle>
                                <EmptyDescription>
                                    {t('messages.goals.no_goals_description')}
                                </EmptyDescription>
                            </EmptyHeader>

                            <Can I="create" a="workspace.goal">
                                <Button onClick={() => { setOpenCreateForm(true) }} className="mt-4 gap-2">
                                    <Plus className="h-4 w-4" />
                                    {t('messages.goals.add_new_goal')}
                                </Button>
                            </Can>
                        </Empty>
                    )}
                </CardContent>
            </Card>

            {/* Create Goal Dialog */}
            <Dialog open={openCreateForm} onOpenChange={setOpenCreateForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('messages.goals.add_new_goal')}</DialogTitle>
                        <DialogDescription>
                            {t('messages.goals.add_new_goal_description')}
                        </DialogDescription>
                    </DialogHeader>

                    <FieldSeparator />

                    <GoalForm onSuccess={() => { setOpenCreateForm(false) }} onCancel={() => { setOpenCreateForm(false) }} />
                </DialogContent>
            </Dialog>

            {/* Edit Goal Dialog */}
            <Dialog open={openEditForm} onOpenChange={closeEditForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('messages.goals.edit_goal')}</DialogTitle>
                        <DialogDescription>
                            {t('messages.goals.edit_goal_description')}
                        </DialogDescription>
                    </DialogHeader>

                    <FieldSeparator />

                    {selectedGoal && (
                        <GoalForm initialData={selectedGoal} onSuccess={() => { setOpenEditForm(false); setSelectedGoal(null); }} onCancel={() => { setOpenEditForm(false); setSelectedGoal(null); }} />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
