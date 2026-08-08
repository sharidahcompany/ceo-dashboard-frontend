"use client";

import React from "react";
import VacanciesForm from "@/components/features/hr/VacanciesForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function CreateVacancyPage() {
    return (
        <PermissionGate permission="workspace.vacancy.create">
            <VacanciesForm />
        </PermissionGate>
    );
}
