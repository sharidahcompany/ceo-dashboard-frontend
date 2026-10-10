import { PermissionGate } from "@/components/shared/PermissionGate";
import GovernanceTransitionsClient from "@/components/features/governance/GovernanceTransitionsClient";
import { getGovernanceTransitions } from "@/actions/workspace/governance.actions";

export default async function GovernanceTransitionsPage() {
  const result =
    await getGovernanceTransitions();

  const transitions =
    result.success
      ? result.data ?? []
      : [];

  return (
    <PermissionGate permission="workspace.governance_transition.view">
      <GovernanceTransitionsClient
        transitions={transitions}
      />
    </PermissionGate>
  );
}
