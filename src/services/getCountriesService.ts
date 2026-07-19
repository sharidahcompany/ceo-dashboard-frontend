import api from "@/lib/api";

export async function getCountries() {
  const response = await api.get("/countries");
  return response.data;
}
