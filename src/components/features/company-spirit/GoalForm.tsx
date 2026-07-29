import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from '@/components/ui/field';
import { useTranslations } from 'next-intl';
import React from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import { FileUpload } from '@/components/ui/file-upload';
import { createGoal, GoalResource, updateGoal } from '@/actions/company-spirit/goal.actions';

interface GoalFormProps {
    initialData?: GoalResource;
    onSuccess: () => void;
    onCancel: () => void;
}

const goalSchema = z.object({
    title: z.object({
        ar: z.string().min(1, "validation.required"),
        en: z.string().min(1, "validation.required"),
    }),
    description: z.object({
        ar: z.string().min(1, "validation.required"),
        en: z.string().min(1, "validation.required"),
    }),
    media: z.any().optional().nullable(),
});

export type GoalFormData = z.infer<typeof goalSchema>;

export default function GoalForm({ initialData, onSuccess, onCancel }: GoalFormProps) {
    const t = useTranslations();

    const { register, handleSubmit, control, formState: { errors } } = useForm<GoalFormData>({
        resolver: zodResolver(goalSchema),
        defaultValues: {
            title: initialData?.title || { ar: "", en: "" },
            description: initialData?.description || { ar: "", en: "" },
            media: null,
        },
    });

    const [isPending, startTransition] = React.useTransition();

    const handleSave = (data: GoalFormData) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("title[ar]", data.title.ar);
            formData.append("title[en]", data.title.en);
            formData.append("description[ar]", data.description.ar);
            formData.append("description[en]", data.description.en);

            if (data.media instanceof File) {
                formData.append("media", data.media);
            }

            const result = await (initialData?.id ? updateGoal(initialData.id, formData) : createGoal(formData));
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success(result.data.message);
            onSuccess();
        });
    };

    return (
        <form onSubmit={handleSubmit(handleSave)}>
            <FieldSet>
                <FieldLegend className='text-muted-foreground mb-5'>
                    {t("locale.ar")}
                </FieldLegend>

                <FieldGroup>
                    <Field orientation="horizontal">
                        <FieldLabel>{t("attributes.title_ar")}</FieldLabel>
                        <Input
                            {...register("title.ar")}
                            placeholder={t("attributes.title_ar")}
                        />
                        {errors.title?.ar && <FieldError>{t(errors.title.ar.message || "")}</FieldError>}
                    </Field>

                    <Field orientation="horizontal">
                        <FieldLabel>{t("attributes.description_ar")}</FieldLabel>
                        <Textarea
                            {...register("description.ar")}
                            placeholder={t("attributes.description_ar")}
                            rows={3}
                        />
                        {errors.description?.ar && <FieldError>{t(errors.description.ar.message || "")}</FieldError>}
                    </Field>
                </FieldGroup>

                <FieldSeparator />

                <FieldLegend className='text-muted-foreground'>
                    {t("locale.en")}
                </FieldLegend>

                <FieldGroup>
                    <Field orientation="horizontal">
                        <FieldLabel>{t("attributes.title_en")}</FieldLabel>
                        <Input
                            {...register("title.en")}
                            placeholder={t("attributes.title_en")}
                        />
                        {errors.title?.en && <FieldError>{t(errors.title.en.message || "")}</FieldError>}
                    </Field>

                    <Field orientation="horizontal">
                        <FieldLabel>{t("attributes.description_en")}</FieldLabel>
                        <Textarea
                            {...register("description.en")}
                            placeholder={t("attributes.description_en")}
                            rows={3}
                        />
                        {errors.description?.en && <FieldError>{t(errors.description.en.message || "")}</FieldError>}
                    </Field>
                </FieldGroup>

                <FieldSeparator />

                <Field orientation="vertical">
                    <FieldLabel>{t("attributes.image")}</FieldLabel>
                    <FileUpload
                        name="media"
                        control={control}
                        initialUrl={initialData?.media_url}
                    />
                    {errors.media && <FieldError>{t(errors.media.message?.toString() || "")}</FieldError>}
                </Field>

                <FieldSeparator />

                <Field>
                    <div className='flex justify-end gap-3'>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isPending}
                        >
                            <X />
                            {t("buttons.cancel")}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                        >
                            {isPending ? <Spinner /> : <Save />}
                            {t("buttons.save")}
                        </Button>
                    </div>
                </Field>
            </FieldSet>
        </form>
    );
}