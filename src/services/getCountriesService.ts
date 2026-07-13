import api from "@/lib/api";

export async function getCountries() {
  const response = await api.get("/auth/countries");
  return response.data;
}
