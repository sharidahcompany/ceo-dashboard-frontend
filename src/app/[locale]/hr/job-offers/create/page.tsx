"use client";

import React from "react";
import JobOfferForm from "@/components/features/hr/JobOfferForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function CreateJobOfferPage() {
    return (
        <PermissionGate permission="workspace.job_offer.create">
            <JobOfferForm />
        </PermissionGate>
    );
}
