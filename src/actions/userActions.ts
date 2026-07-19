"use server";

import api from "@/lib/api";

export async function getMeAction() {
  const response = await api.get("/auth/me");
  return response.data;
}
