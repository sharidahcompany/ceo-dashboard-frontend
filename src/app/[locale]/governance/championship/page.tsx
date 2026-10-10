import { PermissionGate } from "@/components/shared/PermissionGate";
import GovernanceChampionshipClient from "@/components/features/governance/GovernanceChampionshipClient";
import { getChampionshipSeasons } from "@/actions/workspace/governance.actions";

export default async function GovernanceChampionshipPage() {
  const result =
    await getChampionshipSeasons();

  const seasons =
    result.success
      ? result.data ?? []
      : [];

  return (
    <PermissionGate permission="workspace.ceo_championship.view">
      <GovernanceChampionshipClient
        seasons={seasons}
      />
    </PermissionGate>
  );
}
