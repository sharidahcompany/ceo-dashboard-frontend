"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
    getPermissions,
    assignUserPermissions,
} from "@/actions/workspace/user.actions";

interface EmployeePermissionsFormProps {
    employeeId: string;
    initialPermissions?: string[];
}

interface PermissionGroup {
    subject: string;
    service: string;
    resource: string;
    permissions: { full: string; action: string }[];
}

interface ServiceGroup {
    service: string;
    resources: PermissionGroup[];
    permissions: { full: string; action: string }[];
}

function groupPermissions(catalog: string[]): ServiceGroup[] {
    const subjectGroups = new Map<string, { service: string; resource: string; permissions: { full: string; action: string }[] }>();

    (Array.isArray(catalog) ? catalog : []).forEach((permission) => {
        const segments = permission.split(".");
        const action = segments.pop() ?? permission;
        const subject = segments.join(".");
        const [service, ...resourceParts] = segments;
        const resource = resourceParts.join(".");
        if (!subjectGroups.has(subject)) subjectGroups.set(subject, { service, resource, permissions: [] });
        subjectGroups.get(subject)!.permissions.push({ full: permission, action });
    });

    const resourceGroups = Array.from(subjectGroups.entries())
        .map(([subject, { service, resource, permissions }]) => ({ subject, service, resource, permissions }))
        .sort((a, b) => a.resource.localeCompare(b.resource));

    const serviceGroups = new Map<string, PermissionGroup[]>();
    resourceGroups.forEach((group) => {
        if (!serviceGroups.has(group.service)) serviceGroups.set(group.service, []);
        serviceGroups.get(group.service)!.push(group);
    });

    return Array.from(serviceGroups.entries())
        .map(([service, resources]) => ({
            service,
            resources,
            permissions: resources.flatMap((r) => r.permissions),
        }))
        .sort((a, b) => a.service.localeCompare(b.service));
}

function formatLabel(value: string): string {
    return value
        .split(/[._]/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export default function EmployeePermissionsForm({
    employeeId,
    initialPermissions,
}: EmployeePermissionsFormProps) {
    const t = useTranslations();
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);
    const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
    const [selected, setSelected] = useState<Set<string>>(
        new Set(initialPermissions ?? []),
    );

    useEffect(() => {
        const load = async () => {
            const res = await getPermissions();
            if (res.success) {
                setServiceGroups(groupPermissions(res.data));
            } else {
                toast.error(res.error);
            }
            setLoading(false);
        };
        load();
    }, []);

    const totalSelected = selected.size;

    const togglePermission = (permission: string, checked: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (checked) next.add(permission);
            else next.delete(permission);
            return next;
        });
    };

    const toggleEntries = (permissions: { full: string }[], checked: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);
            permissions.forEach(({ full }) => {
                if (checked) next.add(full);
                else next.delete(full);
            });
            return next;
        });
    };

    const isFullySelected = (permissions: { full: string }[]) =>
        permissions.every(({ full }) => selected.has(full));
    const isPartiallySelected = (permissions: { full: string }[]) =>
        !isFullySelected(permissions) && permissions.some(({ full }) => selected.has(full));

    const handleSave = () => {
        startTransition(async () => {
            const res = await assignUserPermissions(employeeId, {
                permissions: Array.from(selected),
            });
            if (res.success) {
                toast.success(res.message || t("success"));
            } else {
                toast.error(res.error);
            }
        });
    };

    const sortedServiceGroups = useMemo(() => serviceGroups, [serviceGroups]);

    return (
        <Card className="w-full">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="size-4" />
                    {t("attributes.permissions")}
                </CardTitle>
                <CardDescription>
                    {t("messages.employees.permissions_description")}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((n) => (
                            <Skeleton key={n} className="h-8 w-full" />
                        ))}
                    </div>
                ) : sortedServiceGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {t("messages.employees.no_permissions_available")}
                    </p>
                ) : (
                    <div className="space-y-8">
                        {sortedServiceGroups.map((serviceGroup) => (
                            <div key={serviceGroup.service} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={isFullySelected(serviceGroup.permissions)}
                                        indeterminate={isPartiallySelected(serviceGroup.permissions)}
                                        onCheckedChange={(checked) =>
                                            toggleEntries(serviceGroup.permissions, checked === true)
                                        }
                                    />
                                    <h3 className="font-semibold text-sm">
                                        {t(`permissions.services.${serviceGroup.service}`, {
                                            defaultValue: formatLabel(serviceGroup.service),
                                        })}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {serviceGroup.resources.map((group) => (
                                        <div
                                            key={group.subject}
                                            className="rounded-lg border p-4 space-y-3"
                                        >
                                            <div className="flex items-center gap-2 border-b pb-2">
                                                <Checkbox
                                                    checked={isFullySelected(group.permissions)}
                                                    indeterminate={isPartiallySelected(group.permissions)}
                                                    onCheckedChange={(checked) =>
                                                        toggleEntries(group.permissions, checked === true)
                                                    }
                                                />
                                                <span className="font-medium text-sm">
                                                    {t(`permissions.subjects.${group.resource}`, {
                                                        defaultValue: formatLabel(group.resource),
                                                    })}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {group.permissions.map(({ full, action }) => (
                                                    <label
                                                        key={full}
                                                        className="flex items-center gap-2 text-sm cursor-pointer"
                                                    >
                                                        <Checkbox
                                                            checked={selected.has(full)}
                                                            onCheckedChange={(checked) =>
                                                                togglePermission(full, checked === true)
                                                            }
                                                        />
                                                        <span className="text-muted-foreground">
                                                            {t(`permissions.actions.${action}`, {
                                                                defaultValue: formatLabel(action),
                                                            })}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                        {t("messages.employees.permissions_selected_count", {
                            count: totalSelected,
                        })}
                    </span>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isPending || loading}
                        className="gap-2"
                    >
                        {isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Save className="size-4" />
                        )}
                        {t("buttons.save")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
