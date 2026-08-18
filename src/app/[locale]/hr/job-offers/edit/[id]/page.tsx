"use client";

import React from "react";
import JobOfferForm from "@/components/features/hr/JobOfferForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function EditJobOfferPage() {
    return (
        <PermissionGate permission="workspace.job_offer.update">
            <JobOfferForm />
        </PermissionGate>
    );
}
