"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { FileUpload } from "@/components/ui/file-upload";

import {
    getCurrentVerificationStatus,
    submitVerificationRequest,
    VerificationRequestResource,
    VerificationStatus,
} from "@/actions/website/verification.actions";
import { getCurrentOrganization } from "@/actions/workspace/organization.actions";

const verificationSchema = z.object({
    id_image: z.any().refine((val) => val instanceof File, "validation.required"),
    commercial_number: z.string().min(1, "validation.required"),
    tax_number: z.string().min(1, "validation.required"),
});

type VerificationFormInput = z.infer<typeof verificationSchema>;

const STATUS_VARIANTS: Record<VerificationStatus, "default" | "secondary" | "destructive"> = {
    pending: "secondary",
    approved: "default",
    rejected: "destructive",
};

export default function VerificationForm() {
    const t = useTranslations("verification");
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [request, setRequest] = useState<VerificationRequestResource | null>(null);

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<VerificationFormInput>({
        resolver: zodResolver(verificationSchema),
        defaultValues: {
            id_image: null,
            commercial_number: "",
            tax_number: "",
        },
    });

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const [statusRes, orgRes] = await Promise.all([
                getCurrentVerificationStatus(),
                getCurrentOrganization(),
            ]);
            if (cancelled) return;

            if (statusRes.success && statusRes.data) {
                setRequest(statusRes.data);
            }
            if (orgRes.success) {
                reset({
                    id_image: null,
                    commercial_number: orgRes.data.commercial_number || "",
                    tax_number: orgRes.data.tax_number || "",
                });
            }
            setIsLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [reset]);

    const onSubmit = (data: VerificationFormInput) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("id_image", data.id_image);
            formData.append("commercial_number", data.commercial_number);
            formData.append("tax_number", data.tax_number);

            const res = await submitVerificationRequest(formData);
            if (res.success) {
                toast.success(t("submitted", { defaultValue: "Verification request submitted" }));
                setRequest(res.data);
            } else {
                toast.error(res.error);
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    const isPendingRequest = request?.status === "pending";

    return (
        <div className="space-y-6">
            {request && (
                <div className="flex items-center gap-3 rounded-lg border p-4">
                    <Badge variant={STATUS_VARIANTS[request.status]}>
                        {t(`status.${request.status}`)}
                    </Badge>
                    {request.status === "rejected" && request.rejection_reason && (
                        <span className="text-sm text-muted-foreground">
                            {request.rejection_reason}
                        </span>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
                <Field>
                    <FieldLabel>{t("id_image")}</FieldLabel>
                    <FileUpload<VerificationFormInput>
                        name="id_image"
                        control={control}
                        accept="image/*"
                    />
                    {errors.id_image && <FieldError>{t(errors.id_image.message as any)}</FieldError>}
                </Field>

                <Field>
                    <FieldLabel>{t("commercial_number")}</FieldLabel>
                    <Input {...register("commercial_number")} disabled={isPendingRequest} />
                    {errors.commercial_number && (
                        <FieldError>{t(errors.commercial_number.message as any)}</FieldError>
                    )}
                </Field>

                <Field>
                    <FieldLabel>{t("tax_number")}</FieldLabel>
                    <Input {...register("tax_number")} disabled={isPendingRequest} />
                    {errors.tax_number && <FieldError>{t(errors.tax_number.message as any)}</FieldError>}
                </Field>

                <Button type="submit" disabled={isPending || isPendingRequest}>
                    {isPending ? t("submitting", { defaultValue: "Submitting..." }) : t("submit")}
                </Button>
            </form>
        </div>
    );
}
