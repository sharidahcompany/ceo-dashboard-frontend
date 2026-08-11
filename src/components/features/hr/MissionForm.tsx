"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, NumericInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, X, Save } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  getMission,
  createMission,
  updateMission,
  MissionData,
} from "@/actions/workspace/missions.actions";
import { UserResource } from "@/actions/workspace/user.actions";
import { MultiSelectUser } from "@/components/ui/multi-select-user";
import { MissionJourneyMapLoader } from "@/components/features/hr/MissionJourneyMapLoader";
import { useMissionLocationTracking } from "@/hooks/use-mission-location-tracking";
import { useAppStore } from "@/providers/StoreProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldContent,
  FieldError,
  FieldSet,
} from "@/components/ui/field";

interface MissionFormValues {
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  actual_start_datetime: string;
  actual_end_datetime: string;
  expense_amount: string;
  assignee_ids: string[];
  status: string;
}

export default function MissionForm() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const missionId =
    (params?.id as string) || (searchParams?.get("id") as string) || undefined;

  const [isPending, startTransition] = useTransition();
  const [loadingData, setLoadingData] = useState(!!missionId);
  const [initialAssignees, setInitialAssignees] = useState<UserResource[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<string | undefined>(
    undefined,
  );
  // Mirrors the mission's status as last persisted on the server (set on
  // load and after a successful save) rather than the live, unsaved form
  // value. Location tracking must only turn on once "in_progress" is
  // actually saved — deriving it from the live dropdown would start the
  // browser's geolocation permission prompt the instant the field is
  // touched, before the form is even submitted.
  const [savedStatus, setSavedStatus] = useState<string | undefined>(
    undefined,
  );

  const statusOptions = [
    { value: "pending", label: t("attributes.pending") || "Pending" },
    {
      value: "in_progress",
      label: t("attributes.in_progress") || "In Progress",
    },
    { value: "completed", label: t("attributes.completed") || "Completed" },
    { value: "cancelled", label: t("attributes.cancelled") || "Cancelled" },
  ];

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<MissionFormValues>({
    defaultValues: {
      title: "",
      description: "",
      start_datetime: "",
      end_datetime: "",
      actual_start_datetime: "",
      actual_end_datetime: "",
      expense_amount: "",
      assignee_ids: [],
      status: "pending",
    },
  });

  useEffect(() => {
    const loadInitialData = async () => {
      if (missionId) {
        const res = await getMission(missionId);
        if (res.success) {
          const data = res.data;

          setValue("title", data.title || "");
          setValue("description", data.description || "");

          // Format datetime to datetime-local input format (YYYY-MM-DDTHH:MM)
          const toLocalInput = (dt?: string | null) =>
            dt ? dt.replace(" ", "T").substring(0, 16) : "";

          setValue("start_datetime", toLocalInput(data.start_datetime));
          setValue("end_datetime", toLocalInput(data.end_datetime));
          setValue(
            "actual_start_datetime",
            toLocalInput(data.actual_start_datetime),
          );
          setValue(
            "actual_end_datetime",
            toLocalInput(data.actual_end_datetime),
          );
          setValue("expense_amount", data.expense_amount ?? "");
          setValue("status", data.status?.value || "pending");
          setApprovalStatus(data.approval_status?.value);
          setSavedStatus(data.status?.value);

          if (data.assignees && data.assignees.length > 0) {
            setInitialAssignees(data.assignees);
            setValue("assignee_ids", (data.assignee_ids as string[]) ?? []);
          }
        } else {
          toast.error(res.error);
        }
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [missionId, setValue]);

  const actualStartDatetime = watch("actual_start_datetime");
  const actualEndDatetime = watch("actual_end_datetime");
  const assigneeIds = watch("assignee_ids");

  const currentUserId = useAppStore((state) => state.user?.id);
  const isAssignee = !!currentUserId && assigneeIds?.includes(currentUserId);
  const isTracking =
    !!missionId && savedStatus === "in_progress" && isAssignee;

  const { lastPoint, error: trackingError } = useMissionLocationTracking(
    missionId,
    isTracking,
  );

  useEffect(() => {
    if (trackingError) toast.error(trackingError);
  }, [trackingError]);

  const formatDisplayDatetime = (dt: string) =>
    dt ? dt.replace("T", " ") : t("attributes.not_set") || "Not set";

  const nowLocalInput = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleStatusChange = (status: string | null) => {
    if (!status) return;
    setValue("status", status);
    if (status === "in_progress") {
      setValue("actual_start_datetime", nowLocalInput());
    } else if (status === "completed") {
      setValue("actual_end_datetime", nowLocalInput());
    }
  };

  const onSubmit = (values: MissionFormValues) => {
    startTransition(async () => {
      const payload: MissionData = {
        title: values.title,
        description: values.description || null,
        start_datetime: values.start_datetime
          ? values.start_datetime.replace("T", " ") + ":00"
          : null,
        end_datetime: values.end_datetime
          ? values.end_datetime.replace("T", " ") + ":00"
          : null,
        actual_start_datetime: values.actual_start_datetime
          ? values.actual_start_datetime.replace("T", " ") + ":00"
          : null,
        actual_end_datetime: values.actual_end_datetime
          ? values.actual_end_datetime.replace("T", " ") + ":00"
          : null,
        expense_amount: values.expense_amount
          ? Number(values.expense_amount)
          : null,
        assignee_ids: values.assignee_ids,
        status: values.status,
      };

      const res = missionId
        ? await updateMission(missionId, payload)
        : await createMission(payload);

      if (res.success) {
        toast.success(res.message || t("success"));
        setSavedStatus(values.status);
        // Creating a mission has nothing to track yet, so return to the
        // list as before. Editing an existing one stays on this page so
        // the journey map/tracker (which only activates once "in_progress"
        // is actually saved) keeps running instead of being unmounted.
        if (!missionId) {
          router.push("/hr/missions");
        }
      } else {
        toast.error(res.error);
      }
    });
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="w-full">
          <CardHeader className="border-b">
            <CardTitle>
              {missionId
                ? t("routes.edit_mission") || "Edit Mission"
                : t("routes.create_mission") || "Create Mission"}
            </CardTitle>
            <CardDescription>
              {t("messages.hr.mission_description") ||
                "Fill in the mission details below"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <FieldSet>
              <FieldGroup className="md:grid md:grid-cols-2 md:gap-5">
                {/* Title */}
                <Field className="md:col-span-2">
                  <FieldLabel>{t("attributes.title") || "Title"}</FieldLabel>
                  <FieldContent>
                    <Input
                      {...register("title", {
                        required: "validation.required",
                      })}
                      placeholder={t("attributes.title") || "Mission title"}
                    />
                    {errors.title && (
                      <FieldError>{t(errors.title.message!)}</FieldError>
                    )}
                  </FieldContent>
                </Field>

                {/* Description */}
                <Field className="md:col-span-2">
                  <FieldLabel>
                    {t("attributes.description") || "Description"}
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      {...register("description")}
                      placeholder={
                        t("attributes.description") || "Mission description"
                      }
                      rows={3}
                    />
                  </FieldContent>
                </Field>

                {/* Start DateTime */}
                <Field>
                  <FieldLabel>
                    {t("attributes.start_datetime") || "Start Date & Time"}
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      type="datetime-local"
                      {...register("start_datetime")}
                    />
                  </FieldContent>
                </Field>

                {/* End DateTime */}
                <Field>
                  <FieldLabel>
                    {t("attributes.end_datetime") || "End Date & Time"}
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      type="datetime-local"
                      {...register("end_datetime")}
                    />
                  </FieldContent>
                </Field>

                {/* Expense Amount */}
                <Field>
                  <FieldLabel>
                    {t("attributes.expense_amount") || "Expense Amount"}
                  </FieldLabel>
                  <FieldContent>
                    <NumericInput
                      {...register("expense_amount")}
                      placeholder="0.00"
                    />
                  </FieldContent>
                </Field>

                {/* Status (only once the mission is approved) */}
                {approvalStatus === "approved" && (
                  <Field>
                    <FieldLabel>
                      {t("attributes.status") || "Status"}
                    </FieldLabel>
                    <FieldContent>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => {
                          const selectedLabel = statusOptions.find(
                            (opt) => opt.value === field.value,
                          )?.label;
                          return (
                            <Select
                              value={field.value}
                              onValueChange={handleStatusChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue>{selectedLabel}</SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        }}
                      />
                    </FieldContent>
                  </Field>
                )}

                {/* Assignees */}
                <Field className="md:col-span-2">
                  <FieldLabel>
                    {t("attributes.assignees") || "Assignees"}
                  </FieldLabel>
                  <FieldContent>
                    <MultiSelectUser
                      control={control}
                      name="assignee_ids"
                      initialUsers={initialAssignees}
                    />
                  </FieldContent>
                </Field>

                {/* Actual Start DateTime (info only) */}
                <Field>
                  <FieldLabel>
                    {t("attributes.actual_start_datetime") || "Actual Start"}
                  </FieldLabel>
                  <FieldContent>
                    <p className="text-sm text-muted-foreground py-2">
                      {formatDisplayDatetime(actualStartDatetime)}
                    </p>
                  </FieldContent>
                </Field>

                {/* Actual End DateTime (info only) */}
                <Field>
                  <FieldLabel>
                    {t("attributes.actual_end_datetime") || "Actual End"}
                  </FieldLabel>
                  <FieldContent>
                    <p className="text-sm text-muted-foreground py-2">
                      {formatDisplayDatetime(actualEndDatetime)}
                    </p>
                  </FieldContent>
                </Field>
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/hr/missions">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className="gap-2"
            >
              <X className="size-4" />
              {t("buttons.cancel")}
            </Button>
          </Link>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {t("buttons.save")}
          </Button>
        </div>
      </form>

      {missionId && (
        <MissionJourneyMapLoader
          missionId={missionId}
          isTracking={isTracking}
          livePoint={lastPoint}
        />
      )}
    </div>
  );
}
