"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";
import { DataGrid } from "@/components/ui/data-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, UserPlus, FileText, Loader2 } from "lucide-react";
import { saveFileDownload } from "@/lib/download";
import { useCan } from "@/providers/AbilityProvider";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { toast } from "sonner";
import {
  getEmployees,
  importEmployees,
  exportEmployees,
  downloadEmployeeImportTemplate,
  deleteEmployees,
  UserResource,
} from "@/actions/workspace/user.actions";
import { hasDefaultContractTemplate } from "@/actions/workspace/document-templates.actions";
import { downloadDocumentPdf } from "@/actions/workspace/documents.actions";

function ContractDownloadCell({ user }: { user: UserResource }) {
  const t = useTranslations();
  const [isDownloading, setIsDownloading] = useState(false);
  const contract = user.contract;

  if (!contract || !contract.has_pdf) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await downloadDocumentPdf(contract.id);
      if (!res.success) {
        toast.error(res.error || t("messages.hr.contract_download_failed"));
        return;
      }
      saveFileDownload({
        base64: res.data.base64,
        filename: res.data.filename,
        contentType: res.data.content_type,
      });
    } catch {
      toast.error(t("messages.hr.contract_download_failed"));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {t("messages.hr.download_contract")}
    </Button>
  );
}

export default function EmployeesPage() {
  const t = useTranslations();
  const canCreate = useCan("workspace.user.create");
  const canEdit = useCan("workspace.user.update");
  const canDelete = useCan("workspace.user.delete");

  const handleExport = async () => {
    const res = await exportEmployees();
    if (!res.success) throw new Error(res.error);
    saveFileDownload(res.data);
  };

  const handleDownloadTemplate = async () => {
    const res = await downloadEmployeeImportTemplate();
    if (!res.success) throw new Error(res.error);
    saveFileDownload(res.data);
  };

  const handleImport = async (file: File) => {
    const templateRes = await hasDefaultContractTemplate();
    if (!templateRes.success) {
      return { success: false, message: templateRes.error };
    }
    if (!templateRes.data) {
      return { success: false, message: t("messages.hr.no_job_contract_template") };
    }

    const res = await importEmployees(file);
    return res.success
      ? { success: true, message: res.message }
      : { success: false, message: res.error, errors: res.errors };
  };

  const handleDelete = async (ids: string[]) => deleteEmployees(ids);

  const columns = useMemo<ColumnDef<UserResource>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: t("attributes.name") || "Name",
        cell: ({ row }) => {
          const u = row.original;
          const fullName =
            u.full_name ||
            `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
            "-";
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {u.avatar && <AvatarImage src={u.avatar} alt={fullName} />}
                <AvatarFallback className="bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{fullName}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: t("attributes.email"),
        cell: ({ row }) => row.original.email || "-",
      },
      {
        accessorKey: "phone",
        header: t("attributes.phone"),
        cell: ({ row }) => row.original.phone || "-",
      },
      {
        id: "contract",
        header: t("messages.hr.contract"),
        enableSorting: false,
        cell: ({ row }) => <ContractDownloadCell user={row.original} />,
      },
    ],
    [t],
  );

  return (
    <PermissionGate permission="workspace.user.view">
    <Card>
      <CardContent>
        <DataGrid<UserResource, any>
          title={t("routes.employees")}
          fetchAction={getEmployees}
          deleteAction={handleDelete}
          columns={columns}
          idKey="id"
          editable={canEdit}
          deletable={canDelete}
          importable
          exportable
          onExport={handleExport}
          onDownloadTemplate={handleDownloadTemplate}
          onImport={handleImport}
          createTitle={canCreate ? t("messages.hr.invite_employee") : undefined}
          createIcon={UserPlus}
        />
      </CardContent>
    </Card>
    </PermissionGate>
  );
}
