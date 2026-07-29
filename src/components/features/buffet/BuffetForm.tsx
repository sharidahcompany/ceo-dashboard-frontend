import { BuffetResource, createBuffet, updateBuffet } from "@/actions/buffet/buffet.actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldSeparator, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelectUser } from "@/components/ui/multi-select-user";
import { SelectBranch } from "@/components/ui/select-branch";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Coffee } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export const buffetSchema = z.object({
    name: z.object({
        ar: z.string().min(1, { message: "validation.required" }),
        en: z.string().min(1, { message: "validation.required" }),
    }),
    branch_id: z.union([z.string(), z.number()]).refine((val) => !!val, {
        message: "validation.required",
    }),
    user_ids: z.array(z.union([z.string(), z.number()])).optional(),
});

export type BuffetFormData = z.infer<typeof buffetSchema>;


export default function BuffetForm({ initialData, onSuccess }: { initialData?: BuffetResource; onSuccess: () => void }) {
    const t = useTranslations();

    const { register, control, handleSubmit, formState: { errors } } = useForm<BuffetFormData>({
        resolver: zodResolver(buffetSchema),
        defaultValues: {
            name: {
                ar: initialData?.name.ar || "",
                en: initialData?.name.en || ""
            }
            ,
            branch_id: initialData?.branch_id || 0,
            user_ids: initialData?.users?.map((user) => user.id) || [],
        },
    });

    const [isPending, startTransition] = React.useTransition();


    const handleSave = (data: BuffetFormData) => {
        startTransition(async () => {

            if (initialData?.id) {
                const result = await updateBuffet(initialData.id, data);
                if (!result.success) {
                    toast.error(result.error);
                    return;
                }
                toast.success(result.data.message); // if we want
                onSuccess();
            } else {
                const result = await createBuffet(data);
                if (!result.success) {
                    toast.error(result.error);
                    return;
                }
                toast.success(result.data.message);
                onSuccess();
            }

        })
    }


    return (
        <form onSubmit={handleSubmit(handleSave)}>
            <FieldSet>
                <FieldGroup>
                    <Field>
                        <Label>
                            {t("attributes.name_ar")}
                        </Label>
                        <Input
                            {...register("name.ar")}
                            placeholder={t("attributes.name_ar")} />
                        {errors?.name?.ar && (<FieldError>{t(errors.name?.ar?.message!)}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <Label>
                            {t("attributes.name_en")}
                        </Label>
                        <Input
                            {...register("name.en")}
                            placeholder={t("attributes.name_en")} />
                        {errors?.name?.en && (<FieldError>{t(errors.name?.en?.message!)}</FieldError>
                        )}
                    </Field>

                    <Field>
                        <Label>{t("attributes.branch")}</Label>
                        <SelectBranch
                            control={control}
                            name="branch_id"
                            initialBranch={initialData?.branch}
                        />
                        {errors?.branch_id && (
                            <FieldError>{t(errors.branch_id.message!)}</FieldError>
                        )}
                    </Field>

                    <Field>
                        <Label>{t("attributes.buffet_employees")}</Label>
                        <MultiSelectUser
                            control={control}
                            name="user_ids"
                            initialUsers={initialData?.users}
                        />
                        {errors?.user_ids && (<FieldError>{t(errors.user_ids?.message!)}</FieldError>
                        )}
                    </Field>
                </FieldGroup>

                <FieldSeparator />

                <FieldGroup>
                    <Button type="submit" disabled={isPending}>
                        {isPending ?
                            (<Spinner />) : (<Coffee />)
                        }
                        {initialData ? t("messages.buffets.update_buffet") : t("messages.buffets.add_new_buffet")}
                    </Button>
                </FieldGroup>
            </FieldSet>
        </form>
    )

}