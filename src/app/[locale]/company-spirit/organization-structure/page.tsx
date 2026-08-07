import { getBranches } from "@/actions/company-spirit/branch.actions";
import { DepartmentResource, getDepartments } from "@/actions/company-spirit/department.actions";
import { getUsers, UserResource } from "@/actions/workspace/user.actions";
import OrganizationStructure from "@/components/features/company-spirit/OrganizationStructure";
import React from "react";

function buildDepartmentTree(departments: DepartmentResource[], usersById: Map<string, UserResource>) {
  const byId = new Map<number, DepartmentResource>();
  departments.forEach((dept) =>
    byId.set(dept.id, {
      ...dept,
      // some list endpoints only return manager_id without eager-loading the
      // manager relation, so fall back to resolving it from the users list
      manager: dept.manager ?? (dept.manager_id != null ? usersById.get(String(dept.manager_id)) ?? null : null),
      children: [],
    })
  );

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
  const [branchesResult, departmentsResult, usersResult] = await Promise.all([
    getBranches(),
    getDepartments("per_page=1000"),
    getUsers("per_page=1000"),
  ]);

  const branches = branchesResult.success ? branchesResult.data.data : [];
  const departments = departmentsResult.success ? departmentsResult.data.data : [];
  const users = usersResult.success ? usersResult.data.data : [];

  const usersById = new Map(users.map((user) => [String(user.id), user]));

  const branchesWithDepartments = (branches ?? []).map((branch) => {
    const branchDepartments = (departments ?? []).filter((dept) => dept.branch_id === branch.id);
    return { ...branch, departments: buildDepartmentTree(branchDepartments, usersById) };
  });

  return (<OrganizationStructure branches={branchesWithDepartments} />)
}
