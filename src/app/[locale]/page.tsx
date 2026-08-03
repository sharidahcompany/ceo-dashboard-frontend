import ReportsPage from "@/app/[locale]/finance/accounting/reports/page";
import { WorkspaceReports } from "@/app/[locale]/_components/workspace-reports";

export default async function Page() {
  return (
    <div className="space-y-10">
      <WorkspaceReports />
      <ReportsPage />
    </div>
  );
}
