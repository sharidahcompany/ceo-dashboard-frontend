import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/actions/workspace/user.actions";
import PlatformPricingEditor from "@/components/features/payments/PlatformPricingEditor";

export default async function PlatformPricingPage() {
  const result = await getAuthenticatedUser();

  if (!result.success || !result.data) {
    notFound();
  }

  const roles = result.data.roles;

  if (!Array.isArray(roles) || !roles.includes("super-admin")) {
    notFound();
  }

  // This page is a local, non-persistent pricing draft editor.
  // Do not load tenant pricing or enable billing from this UI.
  return <PlatformPricingEditor />;
}
