"use client";

import React from "react";
import KanbanBoard from "@/components/features/core-operations/projects/KanbanBoard";
import { useProject } from "../layout";

export default function ProjectBoardPage() {
    const { project, fetchProject } = useProject();

    if (!project) return null;

    return (
        <KanbanBoard project={project} fetchProject={fetchProject} />
    );
}
