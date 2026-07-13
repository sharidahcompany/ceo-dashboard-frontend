"use server";

import { getCountries } from "@/services/getCountriesService";
import { handleAction } from "@/utils/handleAction";

export async function getCountriesAction() {
  return await handleAction(() => getCountries());
}
