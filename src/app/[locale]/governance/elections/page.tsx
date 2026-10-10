import { PermissionGate } from "@/components/shared/PermissionGate";
import GovernanceElectionsClient from "@/components/features/governance/GovernanceElectionsClient";
import { getGovernanceElections } from "@/actions/workspace/governance.actions";

export default async function GovernanceElectionsPage() {
  const result =
    await getGovernanceElections();

  const elections =
    result.success
      ? result.data ?? []
      : [];

  return (
    <PermissionGate permission="workspace.governance_election.view">
      <GovernanceElectionsClient
        elections={elections}
      />
    </PermissionGate>
  );
}
