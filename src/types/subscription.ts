import { getTenantSchema } from "@/schemas/tenantSchema";
import z from "zod";

export type TenantData = z.infer<ReturnType<typeof getTenantSchema>>;
