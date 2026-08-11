import ReportsPage from "@/app/[locale]/finance/accounting/reports/page";
import { WorkspaceReports } from "@/app/[locale]/_components/workspace-reports";
import { BranchesMapLoader } from "@/app/[locale]/_components/branches-map-loader";

export default async function Page() {
  return (
    <div className="space-y-10">
      <BranchesMapLoader />
      <WorkspaceReports />
      <ReportsPage />
    </div>
  );
}
