import { TranslationFunction } from "@/types";
import { z } from "zod";

export const getTenantSchema = (t: TranslationFunction) => {
  return z.object({
    name: z
      .array(z.string())
      .min(1, { message: t("validation.required") })
      .max(255, { message: t("validation.max", { max: 255 }) }),

    commercialNumber: z
      .string()
      .max(100, { message: t("validation.max", { max: 100 }) })
      .nullable()
      .optional(),

    taxNumber: z
      .string()
      .max(100, { message: t("validation.max", { max: 100 }) })
      .nullable()
      .optional(),

    currency: z
      .string()
      .min(1, { message: t("validation.required") })
      .max(3, { message: t("validation.max", { max: 3 }) }),

    country: z
      .string()
      .min(1, { message: t("validation.required") })
      .max(3, { message: t("validation.max", { max: 3 }) }),

    isVatRegistered: z.boolean().optional().default(false),
  });
};
