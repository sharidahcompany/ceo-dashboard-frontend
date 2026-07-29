import { getBranches } from "@/actions/company-spirit/branch.actions";
import OrganizationStructure from "@/components/features/company-spirit/OrganizationStructure";
import React from "react";

export default async function Page() {
  const result = await getBranches();
  const branches = result.success ? result.data.data : [];
  return (<OrganizationStructure branches={branches ?? []} />)
}
