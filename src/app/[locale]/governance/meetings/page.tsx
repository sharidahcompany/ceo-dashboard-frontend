import { PermissionGate } from "@/components/shared/PermissionGate";
import GovernanceMeetingsClient from "@/components/features/governance/GovernanceMeetingsClient";
import { getGovernanceMeetings } from "@/actions/workspace/governance.actions";

export default async function GovernanceMeetingsPage() {
  const result =
    await getGovernanceMeetings();

  const meetings =
    result.success
      ? result.data ?? []
      : [];

  return (
    <PermissionGate permission="workspace.governance_meeting.view">
      <GovernanceMeetingsClient
        meetings={meetings}
      />
    </PermissionGate>
  );
}
