"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { MissionLocationPoint } from "@/actions/workspace/missions.actions";

const MissionJourneyMap = dynamic(
  () => import("./MissionJourneyMap").then((mod) => mod.MissionJourneyMap),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full rounded-xl" /> },
);

export function MissionJourneyMapLoader(props: {
  missionId: number | string;
  isTracking: boolean;
  livePoint: MissionLocationPoint | null;
}) {
  return <MissionJourneyMap {...props} />;
}
