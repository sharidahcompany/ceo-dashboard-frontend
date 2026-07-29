"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Globe, Save, Info, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { getDomain, createDomain } from "@/actions/website/domain-setting.actions";

// DNS records helper info
const DNS_RECORDS = [
    { type: "A", host: "@", value: "76.76.21.21", ttl: "Automatic" },
    { type: "CNAME", host: "www", value: "cname.ceo-app.com", ttl: "Automatic" },
];

const domainFormSchema = z.object({
    type: z.enum(["subdomain", "custom"]),
    subdomain: z.string().optional(),
    customDomain: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.type === "subdomain") {
        if (!data.subdomain || data.subdomain.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "validation.required",
                path: ["subdomain"],
            });
        } else if (!/^[a-zA-Z0-9-]+$/.test(data.subdomain)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "validation.invalid_subdomain",
                path: ["subdomain"],
            });
        }
    } else {
        if (!data.customDomain || data.customDomain.trim() === "") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "validation.required",
                path: ["customDomain"],
            });
        } else if (!/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(data.customDomain)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "validation.invalid_domain",
                path: ["customDomain"],
            });
        }
    }
});

type DomainFormData = z.infer<typeof domainFormSchema>;

interface DomainSettingFormProps {
    tenantId: string | number;
}

export default function DomainSettingForm({ tenantId }: DomainSettingFormProps) {
    const t = useTranslations();
    const [isLoading, setIsLoading] = useState(true);
    const [copiedValue, setCopiedValue] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<DomainFormData>({
        resolver: zodResolver(domainFormSchema),
        defaultValues: {
            type: "subdomain",
            subdomain: "",
            customDomain: "",
        },
    });

    const selectedType = watch("type");

    // Fetch domain on initialization
    useEffect(() => {
        const fetchDomainData = async () => {
            setIsLoading(true);
            const result = await getDomain(tenantId);
            if (result.success && result.data?.data?.domain) {
                const domainStr = result.data.data.domain;
                if (domainStr.endsWith(".ceo-app.com")) {
                    setValue("type", "subdomain");
                    setValue("subdomain", domainStr.replace(".ceo-app.com", ""));
                } else {
                    setValue("type", "custom");
                    setValue("customDomain", domainStr);
                }
            } else if (!result.success) {
                toast.error(result.error || t("errors.unknown_error"));
            }
            setIsLoading(false);
        };
        fetchDomainData();
    }, [tenantId, setValue, t]);

    const handleCopy = (value: string) => {
        navigator.clipboard.writeText(value);
        setCopiedValue(value);
        toast.success(t("messages.copied", { defaultValue: "Copied to clipboard!" }));
        setTimeout(() => setCopiedValue(null), 2000);
    };

    const handleSave = (data: DomainFormData) => {
        startTransition(async () => {
            const domainValue =
                data.type === "subdomain"
                    ? `${data.subdomain?.trim()}.ceo-app.com`
                    : data.customDomain?.trim() || "";

            const result = await createDomain({ domain: domainValue });
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success(result.data.message || t("messages.success"));
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <Spinner className="w-8 h-8" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
            <FieldSet>
                <div className="flex flex-col gap-4">
                    {/* Domain Type Selection */}
                    <Field>
                        <Label>{t("attributes.domain_type", { defaultValue: "Domain Type" })}</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <button
                                type="button"
                                onClick={() => setValue("type", "subdomain")}
                                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                    selectedType === "subdomain"
                                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                                        : "border-border hover:bg-muted/50"
                                }`}
                            >
                                <Globe className="w-5 h-5" />
                                <span className="font-semibold text-sm">
                                    {t("attributes.subdomain", { defaultValue: "Subdomain" })}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setValue("type", "custom")}
                                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                    selectedType === "custom"
                                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                                        : "border-border hover:bg-muted/50"
                                }`}
                            >
                                <Globe className="w-5 h-5" />
                                <span className="font-semibold text-sm">
                                    {t("attributes.custom_domain", { defaultValue: "Custom Domain" })}
                                </span>
                            </button>
                        </div>
                    </Field>

                    <FieldGroup className="mt-4">
                        {selectedType === "subdomain" ? (
                            <Field>
                                <Label>{t("attributes.subdomain", { defaultValue: "Subdomain" })}</Label>
                                <div className="mt-2" dir="ltr">
                                    <InputGroup className="h-10">
                                        <InputGroupInput
                                            {...register("subdomain")}
                                            placeholder="my-company"
                                            className="text-left"
                                        />
                                        <InputGroupAddon align="inline-end" className="bg-muted px-3 border-s">
                                            .ceo-app.com
                                        </InputGroupAddon>
                                    </InputGroup>
                                </div>
                                {errors.subdomain && (
                                    <FieldError>
                                        {t(errors.subdomain.message as string, {
                                            defaultValue: "Invalid subdomain input",
                                        })}
                                    </FieldError>
                                )}
                            </Field>
                        ) : (
                            <div className="space-y-6">
                                <Field>
                                    <Label>{t("attributes.custom_domain", { defaultValue: "Custom Domain" })}</Label>
                                    <Input
                                        dir="ltr"
                                        {...register("customDomain")}
                                        placeholder="example.com"
                                        className="mt-2"
                                    />
                                    {errors.customDomain && (
                                        <FieldError>
                                            {t(errors.customDomain.message as string, {
                                                defaultValue: "Invalid domain format",
                                            })}
                                        </FieldError>
                                    )}
                                </Field>

                                {/* DNS Configuration instructions */}
                                <div className="p-5 border border-dashed rounded-xl bg-muted/30 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-sm">
                                                {t("messages.dns_setup_title", { defaultValue: "DNS Setup Configuration" })}
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {t("messages.dns_setup_description", {
                                                    defaultValue:
                                                        "Please configure the following DNS records at your domain provider (e.g. GoDaddy, Namecheap, Cloudflare) to point your domain to our servers.",
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto rounded-lg border border-border bg-card">
                                        <table className="w-full text-sm text-left border-collapse">
                                            <thead>
                                                <tr className="bg-muted border-b border-border text-xs uppercase text-muted-foreground">
                                                    <th className="px-4 py-2 font-medium">{t("attributes.dns_type", { defaultValue: "Type" })}</th>
                                                    <th className="px-4 py-2 font-medium">{t("attributes.dns_host", { defaultValue: "Host" })}</th>
                                                    <th className="px-4 py-2 font-medium">{t("attributes.dns_value", { defaultValue: "Value" })}</th>
                                                    <th className="px-4 py-2 text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {DNS_RECORDS.map((record, index) => (
                                                    <tr key={index} className="hover:bg-muted/10 text-xs">
                                                        <td className="px-4 py-3 font-semibold text-primary">{record.type}</td>
                                                        <td className="px-4 py-3 font-mono">{record.host}</td>
                                                        <td className="px-4 py-3 font-mono text-muted-foreground truncate max-w-[200px]">
                                                            {record.value}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => handleCopy(record.value)}
                                                            >
                                                                {copiedValue === record.value ? (
                                                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                                                ) : (
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                )}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </FieldGroup>
                </div>
            </FieldSet>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="submit" disabled={isPending} className="gap-2">
                    {isPending ? <Spinner className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {t("buttons.save", { defaultValue: "Save Settings" })}
                </Button>
            </div>
        </form>
    );
}
