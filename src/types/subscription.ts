import { getTenantSchema } from "@/schemas/tenantSchema";
import z from "zod";

export type TenantSchema = z.infer<typeof getTenantSchema>;
