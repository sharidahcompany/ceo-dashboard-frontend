import api from "@/lib/api";

export async function getCurrencies() {
  const response = await api.get("/auth/currencies");
  return response.data;
}
