import { getBranches } from "@/actions/company-spirit/branch.actions";
import { DepartmentResource, getDepartments } from "@/actions/company-spirit/department.actions";
import OrganizationStructure from "@/components/features/company-spirit/OrganizationStructure";
import React from "react";

function buildDepartmentTree(departments: DepartmentResource[]) {
  const byId = new Map<number, DepartmentResource>();
  departments.forEach((dept) => byId.set(dept.id, { ...dept, children: [] }));

  const roots: DepartmentResource[] = [];
  byId.forEach((dept) => {
    if (dept.parent_id && byId.has(dept.parent_id)) {
      byId.get(dept.parent_id)!.children!.push(dept);
    } else {
      roots.push(dept);
    }
  });

  return roots;
}

export default async function Page() {
  const [branchesResult, departmentsResult] = await Promise.all([
    getBranches(),
    getDepartments("per_page=1000"),
  ]);

  const branches = branchesResult.success ? branchesResult.data.data : [];
  const departments = departmentsResult.success ? departmentsResult.data.data : [];

  const branchesWithDepartments = (branches ?? []).map((branch) => {
    const branchDepartments = (departments ?? []).filter((dept) => dept.branch_id === branch.id);
    return { ...branch, departments: buildDepartmentTree(branchDepartments) };
  });

  return (<OrganizationStructure branches={branchesWithDepartments} />)
}
