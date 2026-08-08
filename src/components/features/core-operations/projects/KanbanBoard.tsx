"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, NumericInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Can } from "@/providers/AbilityProvider";
import {
  ProjectResource,
  SprintResource,
  SprintStageResource,
  TaskResource,
  createSprint,
  createStage,
  deleteStage,
  createTask,
  deleteTask,
  moveTask,
  uploadTaskFile,
  deleteTaskFile,
  getTask,
  getComments,
  postComment,
  getRatings,
  postRating,
  syncTaskUsers,
  CommentResource,
  RatingResource,
} from "@/actions/projects/projects.actions";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
  closestCorners,
  useDroppable,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  Send,
  Star,
  Paperclip,
  Clock,
  MessageSquare,
  Activity,
  ArrowUpRight,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";

interface KanbanBoardProps {
  project: ProjectResource;
  fetchProject: () => void;
}

export default function KanbanBoard({
  project,
  fetchProject,
}: KanbanBoardProps) {
  const t = useTranslations("projects");
  const locale = useLocale();

  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [stagesOverride, setStagesOverride] = useState<
    SprintStageResource[] | null
  >(null);

  const activeSprint: SprintResource | null =
    (selectedSprintId !== null &&
      project.sprints?.find((s) => s.id === selectedSprintId)) ||
    (project.sprints && project.sprints.length > 0
      ? project.sprints.find((s) => s.is_active) || project.sprints[0]
      : null);

  const [prevProject, setPrevProject] = useState(project);
  if (prevProject !== project && stagesOverride !== null) {
    setStagesOverride(null);
  }
  if (prevProject !== project) {
    setPrevProject(project);
  }

  const stages: SprintStageResource[] =
    stagesOverride ?? (activeSprint?.stages || []);
  const setStages = setStagesOverride;

  // Drag overlay state
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  // Sprints State
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [sprintStart, setSprintStart] = useState("");
  const [sprintDue, setSprintDue] = useState("");

  // Stages State
  const [isCreateStageOpen, setIsCreateStageOpen] = useState(false);
  const [stageName, setStageName] = useState("");

  // Task Create State
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStory, setTaskStory] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">(
    "medium",
  );
  const [taskStart, setTaskStart] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskFiles, setTaskFiles] = useState<FileList | null>(null);
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);

  // Delete Confirmation State
  const [stagePendingDelete, setStagePendingDelete] = useState<number | null>(
    null,
  );
  const [isDeleteTaskConfirmOpen, setIsDeleteTaskConfirmOpen] = useState(false);

  // Task Details State (Dialog)
  const [selectedTask, setSelectedTask] = useState<TaskResource | null>(null);
  const [comments, setComments] = useState<CommentResource[]>([]);
  const [ratings, setRatings] = useState<RatingResource[]>([]);
  const [newComment, setNewComment] = useState("");
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState("");

  const [isPending, startTransition] = useTransition();

  // Dnd-kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const findTask = (id: number): TaskResource | undefined => {
    for (const stage of stages) {
      const task = stage.tasks?.find((t) => t.id === id);
      if (task) return task;
    }
    return undefined;
  };

  // --- Sprints Action ---
  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim()) return;

    startTransition(async () => {
      const res = await createSprint({
        project_id: project.id,
        name: sprintName,
        start_date: sprintStart || undefined,
        due_date: sprintDue || undefined,
      });

      if (res.success) {
        toast.success(t("sprint_created"));
        setIsCreateSprintOpen(false);
        setSprintName("");
        setSprintStart("");
        setSprintDue("");
        fetchProject();
      } else {
        toast.error(res.error || "Failed to create sprint");
      }
    });
  };

  // --- Stage Action ---
  const handleCreateStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageName.trim() || !activeSprint) return;

    startTransition(async () => {
      const res = await createStage({
        sprint_id: activeSprint.id,
        name: stageName,
        order: stages.length + 1,
      });

      if (res.success) {
        toast.success(t("stage_created"));
        setIsCreateStageOpen(false);
        setStageName("");
        fetchProject();
      } else {
        toast.error(res.error || "Failed to create column");
      }
    });
  };

  const handleDeleteStage = (stageId: number) => {
    setStagePendingDelete(stageId);
  };

  const confirmDeleteStage = async () => {
    if (stagePendingDelete === null) return;
    const res = await deleteStage(stagePendingDelete);
    if (res.success) {
      toast.success(t("stage_deleted"));
      fetchProject();
    } else {
      toast.error(res.error || "Failed to delete stage");
    }
    setStagePendingDelete(null);
  };

  // --- Task Actions ---
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || selectedStageId === null) return;

    const stage = stages.find((s) => s.id === selectedStageId);
    const order = (stage?.tasks?.length || 0) + 1;

    const formData = new FormData();
    formData.append("sprint_stage_id", String(selectedStageId));
    formData.append("name", taskName);
    formData.append("order", String(order));
    formData.append("priority", taskPriority);

    if (taskDesc.trim()) formData.append("description", taskDesc);
    if (taskStory)
      formData.append("story_point", String(parseFloat(taskStory)));
    if (taskStart) formData.append("start_date", taskStart);
    if (taskDue) formData.append("due_date", taskDue);

    if (taskFiles) {
      Array.from(taskFiles).forEach((file) => {
        formData.append("attachments[]", file);
      });
    }

    taskAssignees.forEach((userId) => {
      formData.append("users[]", userId);
    });

    startTransition(async () => {
      const res = await createTask(formData);

      if (res.success) {
        toast.success(t("task_created"));
        setIsCreateTaskOpen(false);
        setTaskName("");
        setTaskDesc("");
        setTaskStory("");
        setTaskPriority("medium");
        setTaskStart("");
        setTaskDue("");
        setTaskFiles(null);
        setTaskAssignees([]);
        fetchProject();
      } else {
        toast.error(res.error || "Failed to create task");
      }
    });
  };

  const handleTaskClick = async (task: TaskResource) => {
    setSelectedTask(task);
    const [commRes, rateRes] = await Promise.all([
      getComments(task.id),
      getRatings(task.id),
    ]);
    if (commRes.success) setComments(commRes.data);
    if (rateRes.success) setRatings(rateRes.data);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    const res = await postComment(selectedTask.id, newComment);
    if (res.success) {
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
      toast.success(t("comment_added"));
    } else {
      toast.error(res.error || "Failed to add comment");
    }
  };

  const handlePostRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const res = await postRating(
      selectedTask.id,
      ratingScore,
      ratingFeedback || undefined,
    );
    if (res.success) {
      setRatings((prev) => [...prev, res.data]);
      setRatingFeedback("");
      toast.success(t("rating_added"));
    } else {
      toast.error(res.error || "Failed to add rating");
    }
  };

  const handleTaskFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedTask) return;

    const formData = new FormData();
    formData.append("attachments[]", files[0]);
    // Reset input so the same file can be re-selected
    e.target.value = "";

    const res = await uploadTaskFile(selectedTask.id, formData);
    if (res.success) {
      toast.success(t("file_uploaded"));
      // Re-fetch task to get the updated attachments list from the server
      const taskRes = await getTask(selectedTask.id);
      if (taskRes.success) setSelectedTask(taskRes.data);
      fetchProject();
    } else {
      toast.error(res.error || "Failed to upload attachment");
    }
  };

  const handleTaskFileDelete = async (fileId: number) => {
    if (!selectedTask) return;
    const res = await deleteTaskFile(selectedTask.id, fileId);
    if (res.success) {
      toast.success(t("file_deleted"));
      const updatedTask = {
        ...selectedTask,
        attachments: (selectedTask.attachments || []).filter(
          (f) => f.id !== fileId,
        ),
      };
      setSelectedTask(updatedTask);
      fetchProject();
    } else {
      toast.error(res.error || "Failed to delete attachment");
    }
  };

  const handleDeleteTask = () => {
    if (!selectedTask) return;
    setIsDeleteTaskConfirmOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!selectedTask) return;

    const res = await deleteTask(selectedTask.id);
    if (res.success) {
      toast.success(t("task_deleted"));
      setSelectedTask(null);
      fetchProject();
    } else {
      toast.error(res.error || "Failed to delete task");
    }
    setIsDeleteTaskConfirmOpen(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = event.active.id as string;
    const taskId = parseInt(activeId.replace("task_", ""), 10);
    setActiveTaskId(taskId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTaskId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const taskId = parseInt(activeId.replace("task_", ""), 10);
    let targetStageId: number;
    let newOrder = 1;

    if (overId.startsWith("stage_")) {
      targetStageId = parseInt(overId.replace("stage_", ""), 10);
      const targetStage = stages.find((s) => s.id === targetStageId);
      newOrder = (targetStage?.tasks?.length || 0) + 1;
    } else {
      const overTaskId = parseInt(overId.replace("task_", ""), 10);
      const targetStage = stages.find((s) =>
        s.tasks?.some((t) => t.id === overTaskId),
      );
      if (!targetStage) return;
      targetStageId = targetStage.id;
      const overTaskIndex =
        targetStage.tasks?.findIndex((t) => t.id === overTaskId) ?? 0;
      newOrder = overTaskIndex + 1;
    }

    let movingTask: TaskResource | undefined;

    const updatedStages = stages.map((s) => {
      const hasTask = s.tasks?.some((t) => t.id === taskId);
      if (hasTask) {
        movingTask = s.tasks?.find((t) => t.id === taskId);
        return {
          ...s,
          tasks: s.tasks?.filter((t) => t.id !== taskId) || [],
        };
      }
      return s;
    });

    if (!movingTask) return;

    const finalStages = updatedStages.map((s) => {
      if (s.id === targetStageId) {
        const list = [...(s.tasks || [])];
        list.splice(newOrder - 1, 0, {
          ...movingTask!,
          sprint_stage_id: targetStageId,
        });
        return {
          ...s,
          tasks: list.map((item, idx) => ({ ...item, order: idx + 1 })),
        };
      }
      return s;
    });

    setStages(finalStages);

    const res = await moveTask(taskId, targetStageId, newOrder);
    if (!res.success) {
      toast.error(res.error || "Failed to move task");
      fetchProject();
    } else {
      toast.success(t("task_moved"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Sprint Controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20 p-4 rounded-xl border">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{t("sprint")}:</span>
          {project.sprints && project.sprints.length > 0 ? (
            <select
              value={activeSprint?.id || ""}
              onChange={(e) => {
                const id = parseInt(e.target.value, 10);
                const selected = project.sprints?.find((s) => s.id === id);
                if (selected) {
                  setSelectedSprintId(id);
                  setStagesOverride(null);
                }
              }}
              className="bg-background border rounded px-2.5 py-1 text-sm font-medium focus-visible:outline-none"
            >
              {project.sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_active ? `(${t("active")})` : ""}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-muted-foreground">
              {t("no_sprints")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Can I="update" a="workspace.project">
          <Dialog
            open={isCreateSprintOpen}
            onOpenChange={setIsCreateSprintOpen}
          >
            <DialogTrigger
              render={
                <Button size="sm" variant="outline">
                  <Plus className="size-4 mr-1.5" />
                  {t("new_sprint")}
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateSprint}>
                <DialogHeader>
                  <DialogTitle>{t("new_sprint")}</DialogTitle>
                  <DialogDescription>
                    {t("create_sprint_desc")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">
                      {t("sprint_name")}
                    </label>
                    <Input
                      required
                      value={sprintName}
                      onChange={(e) => setSprintName(e.target.value)}
                      placeholder="e.g. Sprint 1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">
                        {t("start_date")}
                      </label>
                      <Input
                        type="date"
                        value={sprintStart}
                        onChange={(e) => setSprintStart(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">
                        {t("due_date")}
                      </label>
                      <Input
                        type="date"
                        value={sprintDue}
                        onChange={(e) => setSprintDue(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateSprintOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {t("save")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </Can>

          {activeSprint && (
            <Can I="update" a="workspace.project">
            <Dialog
              open={isCreateStageOpen}
              onOpenChange={setIsCreateStageOpen}
            >
              <DialogTrigger
                render={
                  <Button size="sm" variant="outline">
                    <Sliders className="size-4 mr-1.5" />
                    {t("add_column")}
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleCreateStage}>
                  <DialogHeader>
                    <DialogTitle>{t("add_column")}</DialogTitle>
                    <DialogDescription>
                      {t("create_stage_desc")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">
                        {t("column_name")}
                      </label>
                      <Input
                        required
                        value={stageName}
                        onChange={(e) => setStageName(e.target.value)}
                        placeholder="e.g. Todo"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateStageOpen(false)}
                    >
                      {t("cancel")}
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {t("save")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            </Can>
          )}
        </div>
      </div>

      {/* Kanban Board columns wrapper */}
      {activeSprint ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 pr-1 min-h-[60vh] items-start">
            {stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                onDeleteStage={handleDeleteStage}
                onAddTaskClick={(stageId) => {
                  setSelectedStageId(stageId);
                  setIsCreateTaskOpen(true);
                }}
                onTaskClick={handleTaskClick}
                t={t}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTaskId ? (
              <TaskCard task={findTask(activeTaskId)!} t={t} />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <Activity className="size-12 text-muted-foreground mb-4" />
          <CardTitle className="mb-2">{t("no_sprint_active")}</CardTitle>
          <CardDescription className="mb-6">
            {t("create_sprint_to_start")}
          </CardDescription>
          <Can I="update" a="workspace.project">
            <Button onClick={() => setIsCreateSprintOpen(true)} className="gap-2">
              <Plus className="size-4" />
              {t("new_sprint")}
            </Button>
          </Can>
        </Card>
      )}

      {/* Task Creation Modal */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleCreateTask}>
            <DialogHeader>
              <DialogTitle>{t("create_task")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("task_name")}</label>
                <Input
                  required
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  {t("description_label")}
                </label>
                <Textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    {t("story_points")}
                  </label>
                  <NumericInput
                    value={taskStory}
                    onChange={(e) => setTaskStory(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">{t("priority")}</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="low">{t("low")}</option>
                    <option value="medium">{t("medium")}</option>
                    <option value="high">{t("high")}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    {t("start_date")}
                  </label>
                  <Input
                    type="date"
                    value={taskStart}
                    onChange={(e) => setTaskStart(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">{t("due_date")}</label>
                  <Input
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  {t("attachments")}
                </label>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => setTaskFiles(e.target.files)}
                  className="cursor-pointer"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  {t("team_members_title")}
                </label>
                <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-1.5 border rounded-md bg-muted/10">
                  {(project.team || []).map((member) => {
                    const isSelected = taskAssignees.includes(
                      String(member.id),
                    );
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setTaskAssignees(
                              taskAssignees.filter(
                                (id) => id !== String(member.id),
                              ),
                            );
                          } else {
                            setTaskAssignees([
                              ...taskAssignees,
                              String(member.id),
                            ]);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/30 hover:bg-muted"
                        }`}
                      >
                        <Avatar className="size-4 shrink-0">
                          <AvatarFallback className="text-[8px]">
                            {member.first_name?.[0] || ""}
                            {member.last_name?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {member.first_name} {member.last_name}
                        </span>
                      </button>
                    );
                  })}
                  {(project.team || []).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center w-full py-2">
                      {t("no_members")}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateTaskOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog
        open={selectedTask !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedTask(null);
        }}
      >
        {selectedTask && (
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="mb-4 flex flex-row items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-lg">
                  {selectedTask.name}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1.5">
                  <Badge
                    variant="outline"
                    className={
                      selectedTask.priority === "high"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : selectedTask.priority === "medium"
                          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          : "bg-green-500/10 text-green-500 border-green-500/20"
                    }
                  >
                    {t(selectedTask.priority)}
                  </Badge>
                  {selectedTask.story_point && (
                    <Badge variant="secondary">
                      {selectedTask.story_point} SP
                    </Badge>
                  )}
                </DialogDescription>
              </div>
              <Can I="delete" a="workspace.project">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteTask}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </Button>
              </Can>
            </DialogHeader>

            <div className="space-y-5">
              {/* Description */}
              <div className="space-y-1.5 border-b pb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("description_label")}
                </h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {selectedTask.description || t("no_description")}
                </p>
              </div>

              {/* Assigned Members */}
              <div className="space-y-1.5 border-b pb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("team_members_title")}
                </h4>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(project.team || []).map((member) => {
                    const isAssigned = (selectedTask.users || []).some(
                      (u) => String(u.id) === String(member.id),
                    );
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={async () => {
                          const currentIds = (selectedTask.users || []).map(
                            (u) => String(u.id),
                          );
                          const updatedIds = isAssigned
                            ? currentIds.filter(
                                (id) => id !== String(member.id),
                              )
                            : [...currentIds, String(member.id)];

                          const res = await syncTaskUsers(
                            selectedTask.id,
                            updatedIds,
                          );
                          if (res.success) {
                            toast.success(t("team_updated"));
                            setSelectedTask({
                              ...selectedTask,
                              users: res.data.users,
                            });
                            fetchProject();
                          } else {
                            toast.error(
                              res.error || "Failed to update assignees",
                            );
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors ${
                          isAssigned
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/30 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <Avatar className="size-4 shrink-0">
                          <AvatarFallback className="text-[8px]">
                            {member.first_name?.[0] || ""}
                            {member.last_name?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {member.first_name} {member.last_name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-3 border-b pb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Paperclip className="size-3.5" />
                  {t("attachments")}
                </h4>
                <div className="grid w-full items-center gap-1.5">
                  <input
                    type="file"
                    onChange={handleTaskFileUpload}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2 mt-2">
                  {selectedTask.attachments &&
                  selectedTask.attachments.length > 0 ? (
                    selectedTask.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2 rounded border bg-muted/20 text-xs"
                      >
                        <span className="font-medium truncate pr-4">
                          {file.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <a
                            href={file.full_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7"
                            >
                              <ArrowUpRight className="size-3.5" />
                            </Button>
                          </a>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleTaskFileDelete(file.id)}
                            className="size-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t("no_attachments")}
                    </p>
                  )}
                </div>
              </div>

              {/* Ratings Section */}
              <div className="space-y-3 border-b pb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Star className="size-3.5 text-yellow-500 fill-yellow-500" />
                  {t("ratings")}
                </h4>
                <form
                  onSubmit={handlePostRating}
                  className="flex items-center gap-2"
                >
                  <select
                    value={ratingScore}
                    onChange={(e) =>
                      setRatingScore(parseInt(e.target.value, 10))
                    }
                    className="h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((s) => (
                      <option key={s} value={s}>
                        {s} ★
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder={t("rating_feedback_placeholder")}
                    value={ratingFeedback}
                    onChange={(e) => setRatingFeedback(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm">
                    {t("rate")}
                  </Button>
                </form>
                <div className="space-y-2 mt-2 max-h-[120px] overflow-y-auto">
                  {ratings.map((rate) => (
                    <div
                      key={rate.id}
                      className="p-2 border rounded bg-yellow-500/5 text-xs flex justify-between items-start"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-semibold">{rate.rating} ★</span>
                          <span className="text-muted-foreground">
                            by{" "}
                            {rate.user
                              ? `${rate.user.first_name} ${rate.user.last_name}`
                              : "Member"}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{rate.feedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="size-3.5" />
                  {t("comments")}
                </h4>
                <form onSubmit={handlePostComment} className="flex gap-2">
                  <Input
                    placeholder={t("comment_placeholder")}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" className="size-9">
                    <Send className="size-4" />
                  </Button>
                </form>
                <div className="space-y-2.5 mt-2 max-h-[180px] overflow-y-auto pr-1">
                  {comments.map((comm) => (
                    <div
                      key={comm.id}
                      className="p-2.5 border rounded bg-muted/10 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          {comm.user
                            ? `${comm.user.first_name} ${comm.user.last_name}`
                            : "Member"}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          {new Date(comm.created_at).toLocaleDateString(locale)}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{comm.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Stage Confirmation */}
      <AlertDialog
        open={stagePendingDelete !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setStagePendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm_delete_stage")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("action_cannot_be_undone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStage}
              className="bg-destructive   hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Confirmation */}
      <AlertDialog
        open={isDeleteTaskConfirmOpen}
        onOpenChange={setIsDeleteTaskConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm_delete_task")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("action_cannot_be_undone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface StageColumnProps {
  stage: SprintStageResource;
  onDeleteStage: (id: number) => void;
  onAddTaskClick: (id: number) => void;
  onTaskClick: (task: TaskResource) => void;
  t: any;
}

function StageColumn({
  stage,
  onDeleteStage,
  onAddTaskClick,
  onTaskClick,
  t,
}: StageColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `stage_${stage.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className="w-[300px] flex-shrink-0 bg-muted/40 p-3.5 rounded-xl border border-border/50 flex flex-col gap-3 min-h-[500px]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{stage.name}</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-xs">
            {stage.tasks?.length || 0}
          </Badge>
        </div>
        <Can I="delete" a="workspace.project">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDeleteStage(stage.id)}
            className="size-7 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </Can>
      </div>

      <SortableContext
        items={(stage.tasks || []).map((task) => `task_${task.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 flex-1 min-h-[300px] overflow-y-auto">
          {(stage.tasks || []).map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onTaskClick={onTaskClick}
              t={t}
            />
          ))}
        </div>
      </SortableContext>

      <Can I="create" a="workspace.project">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onAddTaskClick(stage.id)}
          className="w-full justify-start text-xs border border-dashed border-border/60 hover:border-border mt-1"
        >
          <Plus className="size-3.5 mr-1" />
          {t("add_task")}
        </Button>
      </Can>
    </div>
  );
}

interface SortableTaskCardProps {
  task: TaskResource;
  onTaskClick: (task: TaskResource) => void;
  t: any;
}

function SortableTaskCard({ task, onTaskClick, t }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `task_${task.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        t={t}
        onClick={() => onTaskClick(task)}
        attributes={attributes}
        listeners={listeners}
      />
    </div>
  );
}

// Render clean, non-sortable task preview cards
interface TaskCardProps {
  task: TaskResource;
  t: any;
  onClick?: () => void;
  attributes?: any;
  listeners?: any;
}

function TaskCard({ task, t, onClick, attributes, listeners }: TaskCardProps) {
  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "high":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-500 border-red-500/20 px-1 py-0 text-[10px]"
          >
            {t("high")}
          </Badge>
        );
      case "medium":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-1 py-0 text-[10px]"
          >
            {t("medium")}
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-500 border-green-500/20 px-1 py-0 text-[10px]"
          >
            {t("low")}
          </Badge>
        );
    }
  };

  return (
    <Card
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab active:cursor-grabbing border shadow-none ring-0 ring-transparent bg-background"
    >
      <CardHeader className="p-3 pb-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          {getPriorityBadge(task.priority)}
          {task.story_point && (
            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {task.story_point} SP
            </span>
          )}
        </div>
        <CardTitle className="text-sm font-medium line-clamp-2">
          {task.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2.5">
        {/* Row: Avatars + Ratings & Comments Indicators */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {task.users && task.users.length > 0 ? (
            <div className="flex -space-x-1.5 overflow-hidden">
              {task.users.slice(0, 3).map((user) => (
                <Avatar
                  key={user.id}
                  className="size-5 border border-background"
                >
                  <AvatarFallback className="text-[7px]">
                    {user.first_name?.[0] || ""}
                    {user.last_name?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.users.length > 3 && (
                <div className="size-5 rounded-full border border-background bg-muted text-[7px] font-semibold text-muted-foreground flex items-center justify-center">
                  +{task.users.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5 text-muted-foreground text-[10px] shrink-0 font-medium">
            {task.average_rating !== undefined &&
              task.average_rating !== null && (
                <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-500">
                  <Star className="size-3 fill-amber-500/20 text-amber-500" />
                  {task.average_rating}
                </span>
              )}
            {task.comments_count !== undefined && task.comments_count > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageSquare className="size-3" />
                {task.comments_count}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {task.due_date && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
              <Clock className="size-3" />
              <span>{new Date(task.due_date).toLocaleDateString()}</span>
            </div>
          )}
          {task.due_date && (
            <TaskStopwatch dueDate={task.due_date} endDate={task.end_date} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TaskStopwatch({
  dueDate,
  endDate,
}: {
  dueDate: string;
  endDate?: string;
}) {
  const t = useTranslations("projects");
  const calculateTime = React.useCallback(() => {
    const due = new Date(dueDate).getTime();
    const hasEnded = !!endDate;
    const now = hasEnded && endDate ? new Date(endDate).getTime() : Date.now();
    const diffMs = due - now;

    const isOverdue = diffMs < 0;
    const absDiff = Math.abs(diffMs);

    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

    const pad = (num: number) => String(num).padStart(2, "0");

    let timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    if (days > 0) {
      timeStr = `${days}d ${timeStr}`;
    }

    return { timeStr, isOverdue, hasEnded };
  }, [dueDate, endDate]);

  const [state, setState] = useState(calculateTime);

  useEffect(() => {
    if (state.hasEnded) return;

    const interval = setInterval(() => {
      setState(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateTime, state.hasEnded]);

  const badgeClass = state.isOverdue
    ? "bg-red-500/10 text-red-600 border-red-500/20"
    : "bg-green-500/10 text-green-600 border-green-500/20";

  const textStr = state.isOverdue
    ? t("time_late", { time: state.timeStr })
    : state.hasEnded
      ? t("time_saved", { time: state.timeStr })
      : t("time_left", { time: state.timeStr });

  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold ${badgeClass}`}
    >
      <Clock className="size-2.5 shrink-0" />
      <span className="font-mono tracking-wider">{textStr}</span>
    </Badge>
  );
}
