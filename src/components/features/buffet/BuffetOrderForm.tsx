"use client";

import {
  BuffetOrderResource,
  createBuffetOrder,
  updateBuffetOrder,
} from "@/actions/buffet/buffet-orders.actions";
import { getBuffetItems } from "@/actions/buffet/buffet-item.actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const buffetOrderItemSchema = z.object({
  buffet_item_id: z.union([z.string(), z.number()]).refine((val) => !!val, {
    message: "validation.required",
  }),
  quantity: z.number().min(1, { message: "validation.required" }),
  notes: z.string().optional().nullable(),
});

const buffetOrderSchema = z.object({
  notes: z.string().optional().nullable(),
  items: z.array(buffetOrderItemSchema).min(1, {
    message: "At least one item is required",
  }),
  status: z
    .enum(["pending", "processing", "rejected", "completed", "cancelled"])
    .optional(),
});

export type BuffetOrderFormDataSchema = z.infer<typeof buffetOrderSchema>;

export default function BuffetOrderForm({
  initialData,
  onSuccess,
}: {
  initialData?: BuffetOrderResource;
  onSuccess: () => void;
}) {
  const t = useTranslations();
  const [buffetItems, setBuffetItems] = React.useState<any[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);

  React.useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      const result = await getBuffetItems({ limit: 1000 });
      if (result.success) {
        setBuffetItems(result.data.data || []);
      } else {
        toast.error("Failed to load buffet items");
      }
      setLoadingItems(false);
    };
    fetchItems();
  }, []);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BuffetOrderFormDataSchema>({
    resolver: zodResolver(buffetOrderSchema),
    defaultValues: {
      notes: initialData?.notes || "",
      items: initialData?.items?.length
        ? initialData.items.map((item) => ({
          buffet_item_id: item.buffet_item_id,
          quantity: item.quantity,
          notes: item.notes,
        }))
        : [
          {
            buffet_item_id: "",
            quantity: 1,
            notes: "",
          },
        ],
      status: (initialData?.status as any) || "pending",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const [isPending, startTransition] = React.useTransition();

  const handleSave = (data: BuffetOrderFormDataSchema) => {
    startTransition(async () => {
      const payload = {
        notes: data.notes,
        items: data.items,
        status: data.status,
      };

      if (initialData?.id) {
        const result = await updateBuffetOrder(initialData.id, payload);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success(result.data.message);
      } else {
        const result = await createBuffetOrder(payload);
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success(result.data.message);
      }
      onSuccess();
    });
  };

  const handleAddItem = () => {
    append({
      buffet_item_id: "",
      quantity: 1,
      notes: "",
    });
  };

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
      <FieldSet>
        <FieldGroup>
          {/* General Notes */}
          <Field>
            <Label>{t("attributes.notes") || "Order Notes"}</Label>
            <Textarea
              {...register("notes")}
              placeholder={
                t("attributes.notes") || "Add any special notes for this order"
              }
            />
            {errors?.notes?.message && (
              <FieldError>{t(errors.notes.message)}</FieldError>
            )}
          </Field>

          {/* Status */}
          {initialData?.id && (
            <Field>
              <Label>{t("attributes.status") || "Order Status"}</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        {t("messages.buffets.status_pending") || "Pending"}
                      </SelectItem>
                      <SelectItem value="processing">
                        {t("messages.buffets.status_processing") ||
                          "Processing"}
                      </SelectItem>
                      <SelectItem value="completed">
                        {t("messages.buffets.status_completed") || "Completed"}
                      </SelectItem>
                      <SelectItem value="rejected">
                        {t("messages.buffets.status_rejected") || "Rejected"}
                      </SelectItem>
                      <SelectItem value="cancelled">
                        {t("messages.buffets.status_cancelled") || "Cancelled"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors?.status?.message && (
                <FieldError>{t(errors.status.message)}</FieldError>
              )}
            </Field>
          )}
        </FieldGroup>
      </FieldSet>

      <FieldSeparator className="mb-5" />

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            {t("messages.buffets.items") || "Order Items"}
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("buttons.add") || "Add Item"}
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 border rounded-lg space-y-3 bg-muted/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Item Selection */}
                  <Field>
                    <Label>{t("attributes.buffet_item") || "Item"} *</Label>
                    <Controller
                      control={control}
                      name={`items.${index}.buffet_item_id`}
                      render={({ field }) => (
                        <Select
                          value={String(field.value)}
                          onValueChange={(value) => field.onChange(value)}
                          disabled={loadingItems}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingItems
                                  ? "Loading items..."
                                  : "Select an item"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {buffetItems.map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.name_localized} - {item.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors?.items?.[index]?.buffet_item_id?.message && (
                      <FieldError>
                        {t(errors.items[index]?.buffet_item_id?.message)}
                      </FieldError>
                    )}
                  </Field>

                  {/* Quantity */}
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <Label>{t("attributes.quantity") || "Quantity"} *</Label>
                      <Input
                        type="number"
                        {...register(`items.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                        min="1"
                        placeholder="1"
                      />
                      {errors?.items?.[index]?.quantity?.message && (
                        <FieldError>
                          {t(errors.items[index]?.quantity?.message)}
                        </FieldError>
                      )}
                    </Field>

                    <div />
                  </div>

                  {/* Item Notes */}
                  <Field>
                    <Label>{t("attributes.notes") || "Item Notes"}</Label>
                    <Textarea
                      {...register(`items.${index}.notes`)}
                      placeholder="Special notes for this item"
                      className="min-h-12"
                    />
                  </Field>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className="mt-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {errors?.items &&
          typeof errors.items === "object" &&
          !Array.isArray(errors.items) && (
            <FieldError>
              {errors.items.message || "At least one item is required"}
            </FieldError>
          )}
      </div>

      <FieldSeparator className="mb-5" />

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" disabled={isPending}>
          {t("buttons.cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner className="w-4 h-4 mr-2" />}
          {initialData?.id
            ? t("buttons.update") || "Update"
            : t("buttons.create") || "Create"}
        </Button>
      </div>
    </form>
  );
}
