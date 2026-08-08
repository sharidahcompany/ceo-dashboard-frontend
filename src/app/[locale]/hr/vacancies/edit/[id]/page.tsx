"use client";

import React from "react";
import VacanciesForm from "@/components/features/hr/VacanciesForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function EditVacancyPage() {
    return (
        <PermissionGate permission="workspace.vacancy.update">
            <VacanciesForm />
        </PermissionGate>
    );
}
