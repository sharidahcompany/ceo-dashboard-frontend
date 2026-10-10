import { getTranslations } from "next-intl/server";
import { PermissionGate } from "@/components/shared/PermissionGate";
import GovernanceRecordList from "@/components/features/governance/GovernanceRecordList";
import { getGovernanceBodies } from "@/actions/workspace/governance.actions";

export default async function GovernanceBodiesPage() {
  const t = await getTranslations("governance");

  const result =
    await getGovernanceBodies();

  const records =
    result.success
      ? result.data
      : [];

  return (
    <PermissionGate permission="workspace.governance_body.view">
      <GovernanceRecordList
        title={t("bodies.title")}
        description={t("bodies.description")}
        records={records}
        emptyText={t("empty")}
      />
    </PermissionGate>
  );
}
