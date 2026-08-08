"use client";

import React from "react";
import EmployeeForm from "@/components/features/hr/EmployeeForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function EditEmployeePage() {
    return (
        <PermissionGate permission="workspace.user.update">
            <EmployeeForm />
        </PermissionGate>
    );
}
