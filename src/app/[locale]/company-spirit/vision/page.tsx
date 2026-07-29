import { getVision } from "@/actions/company-spirit/vision.actions";
import Vision from "@/components/features/company-spirit/Vision";
import React from "react";

export default async function Page() {
  const response = await getVision();

  const vision = response.success ? response.data.data : null;

  return <Vision vision={vision ?? null} />

}
