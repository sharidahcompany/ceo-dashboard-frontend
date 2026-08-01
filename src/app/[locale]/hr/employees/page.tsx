"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";

export default function Page() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
                
                <Link href="/hr/employees/create">
                    <Button className="gap-2">
                        <Plus className="size-4" />
                        Create
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Employees Directory</CardTitle>
                    <CardDescription>Manage and view all records for employees.</CardDescription>
                </CardHeader>
                <CardContent className="min-h-[200px] flex items-center justify-center border-dashed border-2 rounded-lg m-6">
                    <p className="text-muted-foreground">No records found.</p>
                </CardContent>
            </Card>
        </div>
    );
}
