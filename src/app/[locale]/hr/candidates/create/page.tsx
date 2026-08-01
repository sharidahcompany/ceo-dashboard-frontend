"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

export default function Page() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/hr/candidates">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="size-5" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Create Candidate</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Create Candidate Form</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Form implementation goes here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
