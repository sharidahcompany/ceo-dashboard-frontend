"use server";

import { getCurrencies } from "@/services/getCurrenciesService";
import { handleAction } from "@/utils/handleAction";

export async function getCurrenciesAction() {
  return await handleAction(() => getCurrencies());
}
