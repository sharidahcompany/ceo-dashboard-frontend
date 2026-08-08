"use client";

import React from "react";
import InterviewsForm from "@/components/features/hr/InterviewsForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function CreateInterviewPage() {
    return (
        <PermissionGate permission="workspace.job_interview.create">
            <InterviewsForm />
        </PermissionGate>
    );
}
