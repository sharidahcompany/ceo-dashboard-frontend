import api from "@/lib/api";

export async function getCurrencies() {
  const response = await api.get("/currencies");
  return response.data;
}
