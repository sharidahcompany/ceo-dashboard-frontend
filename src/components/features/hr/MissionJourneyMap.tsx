"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  getMissionLocations,
  MissionLocationPoint,
} from "@/actions/workspace/missions.actions";

const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753];

const startIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:9999px;background:#22c55e;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const currentIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#3b82f6;border:2px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.35);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 15);
      return;
    }
    map.fitBounds(positions, { padding: [32, 32] });
  }, [map, positions]);

  return null;
}

export function MissionJourneyMap({
  missionId,
  isTracking,
  livePoint,
}: {
  missionId: number | string;
  isTracking: boolean;
  livePoint: MissionLocationPoint | null;
}) {
  const t = useTranslations();

  const { data: response, isLoading } = useQuery({
    queryKey: ["mission-locations", missionId],
    queryFn: () => getMissionLocations(missionId),
    refetchInterval: isTracking ? 15000 : false,
  });

  const points = useMemo(() => {
    if (!response?.success) return [];
    return response.data;
  }, [response]);

  const positions = useMemo<[number, number][]>(
    () => points.map((p) => [Number(p.latitude), Number(p.longitude)]),
    [points],
  );

  const livePosition: [number, number] | null = livePoint
    ? [Number(livePoint.latitude), Number(livePoint.longitude)]
    : null;

  const allPositions = livePosition ? [...positions, livePosition] : positions;

  return (
    <Card className="w-full">
      <CardHeader className="border-b flex-row items-center justify-between">
        <CardTitle>{t("attributes.journey") || "Journey"}</CardTitle>
        {isTracking && (
          <Badge variant="default" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-current animate-pulse" />
            {t("attributes.tracking") || "Tracking"}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading && <Skeleton className="h-96 w-full rounded-xl" />}

        {!isLoading && allPositions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t("messages.hr.no_journey_recorded") ||
              "No location data recorded for this mission yet."}
          </p>
        )}

        {!isLoading && allPositions.length > 0 && (
          <MapContainer
            center={allPositions[0] ?? DEFAULT_CENTER}
            zoom={14}
            scrollWheelZoom={true}
            className="h-96 w-full rounded-xl z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="CEO"
            />
            <FitBounds positions={allPositions} />

            {positions.length > 1 && (
              <Polyline positions={positions} color="#3b82f6" weight={4} />
            )}

            {positions.length > 0 && (
              <Marker position={positions[0]} icon={startIcon}>
                <Popup>{t("attributes.actual_start_datetime") || "Start"}</Popup>
              </Marker>
            )}

            {livePosition && (
              <Marker position={livePosition} icon={currentIcon}>
                <Popup>{t("attributes.tracking") || "Current position"}</Popup>
              </Marker>
            )}
          </MapContainer>
        )}
      </CardContent>
    </Card>
  );
}
