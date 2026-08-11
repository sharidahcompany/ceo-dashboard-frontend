"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { CarLocationPoint } from "@/actions/workspace/cars.actions";

const CarJourneyMap = dynamic(
  () => import("./CarJourneyMap").then((mod) => mod.CarJourneyMap),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full rounded-xl" /> },
);

export function CarJourneyMapLoader(props: {
  carId: number | string;
  isTracking: boolean;
  livePoint: CarLocationPoint | null;
}) {
  return <CarJourneyMap {...props} />;
}
