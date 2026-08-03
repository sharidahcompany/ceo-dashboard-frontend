"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getMissionRequests } from "@/actions/workspace/employees-requests.actions";
import {
  deleteMissions,
  updateMission,
  MissionResource,
} from "@/actions/workspace/missions.actions";
import { EditableStatusSelect } from "@/components/features/hr/EditableStatusSelect";
import { Badge } from "@/components/ui/badge";

export default function MissionRequestsPage() {
  const t = useTranslations();

  const columns = useMemo<ColumnDef<MissionResource>[]>(
    () => [
      {
        accessorKey: "title",
        header: t("attributes.title") || "Title",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.title}
          </span>
        ),
      },
      {
        accessorKey: "assignees",
        header: t("attributes.assignees") || "Assignees",
        cell: ({ row }) => {
          const assignees = row.original.assignees ?? [];
          if (assignees.length === 0)
            return <span className="text-muted-foreground">-</span>;
          return (
            <TooltipProvider delay={200}>
              <div className="flex items-center -space-x-2">
                {assignees.slice(0, 4).map((u) => {
                  const name =
                    `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                    u.username ||
                    "";
                  return (
                    <Tooltip key={String(u.id)}>
                      <TooltipTrigger>
                        <Avatar className="h-7 w-7 border-2 border-background cursor-pointer">
                          {u.avatar && (
                            <AvatarImage src={u.avatar} alt={name} />
                          )}
                          <AvatarFallback className="bg-muted text-[10px]">
                            <User className="h-3 w-3 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{name}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
                {assignees.length > 4 && (
                  <span className="ms-3 text-xs text-muted-foreground">
                    +{assignees.length - 4}
                  </span>
                )}
              </div>
            </TooltipProvider>
          );
        },
      },
      {
        accessorKey: "start_datetime",
        header: t("attributes.start_datetime") || "Start",
        cell: ({ row }) => {
          const val = row.original.start_datetime;
          return val ? String(val).substring(0, 16).replace("T", " ") : "-";
        },
      },
      {
        accessorKey: "end_datetime",
        header: t("attributes.end_datetime") || "End",
        cell: ({ row }) => {
          const val = row.original.end_datetime;
          return val ? String(val).substring(0, 16).replace("T", " ") : "-";
        },
      },
      {
        accessorKey: "expense_amount",
        header: t("attributes.expense_amount") || "Expense",
        cell: ({ row }) => {
          const val = row.original.expense_amount;
          return val ? `${Number(val).toFixed(2)}` : "-";
        },
      },
      {
        accessorKey: "status",
        header: t("attributes.status") || "Status",
        cell: ({ row }) => {
          const status = row.original.status;

          // Map status values to their labels and badge variants
          const statusConfig: Record<
            string,
            {
              label: string;
              variant: "outline" | "default" | "secondary" | "destructive";
            }
          > = {
            pending: {
              label: t("attributes.pending") || "Pending",
              variant: "outline",
            },
            in_progress: {
              label: t("attributes.in_progress") || "In Progress",
              variant: "default",
            },
            completed: {
              label: t("attributes.completed") || "Completed",
              variant: "secondary",
            },
            cancelled: {
              label: t("attributes.cancelled") || "Cancelled",
              variant: "destructive",
            },
          };

          // Extract the value (handles cases whether status is an object like `{ value: 'pending' }` or a raw string)
          const currentStatusValue =
            typeof status === "object" ? status?.value : status;
          const config = statusConfig[currentStatusValue] || {
            label: currentStatusValue || "-",
            variant: "outline",
          };

          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: "approval_status",
        header: t("attributes.approval_status") || "Approval",
        cell: ({ row }) => {
          const approval = row.original.approval_status;
          const options = [
            {
              value: "pending",
              label: t("attributes.pending") || "Pending",
              variant: "outline" as const,
            },
            {
              value: "approved",
              label: t("attributes.approved") || "Approved",
              variant: "default" as const,
            },
            {
              value: "rejected",
              label: t("attributes.rejected") || "Rejected",
              variant: "destructive" as const,
            },
          ];
          return (
            <EditableStatusSelect
              value={approval?.value || ""}
              options={options}
              onChange={(newValue) =>
                updateMission(row.original.id, { approval_status: newValue })
              }
            />
          );
        },
      },
    ],
    [t],
  );

  const handleDelete = async (ids: string[]) => {
    const numericIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id));
    return deleteMissions(numericIds);
  };

  return (
    <Card>
      <CardContent>
        <DataGrid<MissionResource, any>
          title={t("routes.mission_requests") || "Mission Requests"}
          description={
            t("messages.hr.missions_description") ||
            "Manage and track employee missions"
          }
          fetchAction={getMissionRequests}
          deleteAction={handleDelete}
          columns={columns}
          idKey="id"
          editable={false}
        />
      </CardContent>
    </Card>
  );
}
