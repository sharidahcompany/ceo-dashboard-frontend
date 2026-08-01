"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import AttendanceForm from "@/components/features/hr/AttendanceForm";

export default function Page() {
    return (
        <AttendanceForm />
    );
}
