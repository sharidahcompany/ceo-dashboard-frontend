import { PermissionGate } from "@/components/shared/PermissionGate";
import GovernanceApprovalsClient from "@/components/features/governance/GovernanceApprovalsClient";
import { getApprovalCases } from "@/actions/workspace/governance.actions";

export default async function GovernanceApprovalsPage() {
  const result =
    await getApprovalCases();

  const cases =
    result.success
      ? result.data ?? []
      : [];

  return (
    <PermissionGate permission="workspace.enterprise_approval.view">
      <GovernanceApprovalsClient
        cases={cases}
      />
    </PermissionGate>
  );
}
