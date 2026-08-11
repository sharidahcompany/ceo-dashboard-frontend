"use client";

import { useEffect, useMemo, useRef } from "react";
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
import {
  getAllTenantsBranches,
  getAllTenantsLiveMissions,
  getAllTenantsLiveCars,
  TenantBranch,
  TenantMission,
  TenantCar,
} from "@/actions/company-spirit/branches-map.actions";
import { BranchResource } from "@/actions/company-spirit/branch.actions";
import { BranchReports } from "@/app/[locale]/_components/branch-reports";

const MISSIONS_LINE_COLOR = "#3b82f6";
const CARS_LINE_COLOR = "#22c55e";
const CAR_OFFLINE_COLOR = "#9ca3af";
const LIVE_TRACKING_REFETCH_MS = 15000;

const FALLBACK_ICON_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";

const logoIconCache = new Map<string, L.DivIcon>();

function getLogoIcon(logoUrl?: string | null) {
  const url = logoUrl || FALLBACK_ICON_URL;
  const cached = logoIconCache.get(url);
  if (cached) return cached;

  const icon = L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);overflow:hidden;background:white;"><img src="${url}" style="width:100%;height:100%;object-fit:cover;" /></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
  logoIconCache.set(url, icon);
  return icon;
}

const currentMissionIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:${MISSIONS_LINE_COLOR};border:2px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.35);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function buildCarIcon(isOnline: boolean) {
  const color = isOnline ? CARS_LINE_COLOR : CAR_OFFLINE_COLOR;
  const glow = isOnline ? "rgba(34,197,94,0.35)" : "rgba(156,163,175,0.35)";
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 4px ${glow};display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;">🚗</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const onlineCarIcon = buildCarIcon(true);
const offlineCarIcon = buildCarIcon(false);

const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753];

function branchName(branch: BranchResource) {
  return (
    branch.name_localized ||
    Object.values(branch.name ?? {})[0] ||
    branch.code ||
    `#${branch.id}`
  );
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  // Only auto-fit once, the first time positions arrive. Missions refetch
  // every 15s, and re-fitting on every poll would yank the view out from
  // under anyone who has since panned/zoomed.
  const hasFitRef = useRef(false);

  useEffect(() => {
    if (hasFitRef.current || positions.length === 0) return;
    hasFitRef.current = true;
    if (positions.length === 1) {
      map.setView(positions[0], 13);
      return;
    }
    map.fitBounds(positions, { padding: [32, 32] });
  }, [map, positions]);

  return null;
}

export function BranchesMap() {
  const t = useTranslations("branches_map");

  const { data: response, isLoading } = useQuery({
    queryKey: ["branches-map"],
    queryFn: () => getAllTenantsBranches(),
  });

  const { data: missionsResponse } = useQuery({
    queryKey: ["branches-map-live-missions"],
    queryFn: () => getAllTenantsLiveMissions(),
    refetchInterval: LIVE_TRACKING_REFETCH_MS,
  });

  const { data: carsResponse } = useQuery({
    queryKey: ["branches-map-live-cars"],
    queryFn: () => getAllTenantsLiveCars(),
    refetchInterval: LIVE_TRACKING_REFETCH_MS,
  });

  const tenantBranches = useMemo<TenantBranch[]>(() => {
    if (!response?.success) return [];
    return response.data;
  }, [response]);

  const tenantMissions = useMemo<TenantMission[]>(() => {
    if (!missionsResponse?.success) return [];
    return missionsResponse.data;
  }, [missionsResponse]);

  const tenantCars = useMemo<TenantCar[]>(() => {
    if (!carsResponse?.success) return [];
    return carsResponse.data;
  }, [carsResponse]);

  const missionLines = useMemo(
    () =>
      tenantMissions.map(({ mission, tenantId }) => ({
        key: `${tenantId}-${mission.id}`,
        title: mission.title,
        positions: mission.locations.map(
          (point): [number, number] => [
            Number(point.latitude),
            Number(point.longitude),
          ],
        ),
      })),
    [tenantMissions],
  );

  const carLines = useMemo(
    () =>
      tenantCars.map(({ car, tenantId, tenantName }) => ({
        key: `${tenantId}-${car.id}`,
        title: car.model,
        tenantName,
        isOnline: car.is_online,
        driverName: car.current_assignment?.user
          ? `${car.current_assignment.user.first_name || ""} ${car.current_assignment.user.last_name || ""}`.trim() ||
            car.current_assignment.user.username
          : null,
        positions: car.locations.map(
          (point): [number, number] => [
            Number(point.latitude),
            Number(point.longitude),
          ],
        ),
      })),
    [tenantCars],
  );

  const branchPositions = useMemo<[number, number][]>(
    () =>
      tenantBranches.map(({ branch }) => [
        Number(branch.latitude),
        Number(branch.longitude),
      ]),
    [tenantBranches],
  );

  const positions = useMemo<[number, number][]>(
    () => [
      ...branchPositions,
      ...missionLines.flatMap((line) => line.positions),
      ...carLines.flatMap((line) => line.positions),
    ],
    [branchPositions, missionLines, carLines],
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t("title")}</CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="h-0.5 w-4 rounded-full"
              style={{ backgroundColor: MISSIONS_LINE_COLOR }}
            />
            {t("missions_legend") || "Missions"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: CARS_LINE_COLOR }}
            />
            {t("cars_online_legend") || "Cars (online)"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: CAR_OFFLINE_COLOR }}
            />
            {t("cars_offline_legend") || "Cars (offline)"}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-96 w-full rounded-xl" />}

        {!isLoading && tenantBranches.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("no_data")}</p>
        )}

        {!isLoading && tenantBranches.length > 0 && (
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={10}
            scrollWheelZoom={true}
            className="h-96 w-full rounded-xl z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="CEO"
            />
            <FitBounds positions={positions} />
            {tenantBranches.map(({ branch, tenantId, tenantName, logoUrl }) => (
              <Marker
                key={`${tenantId}-${branch.id}`}
                position={[Number(branch.latitude), Number(branch.longitude)]}
                icon={getLogoIcon(logoUrl)}
              >
                <Popup>
                  <p className="font-medium">{branchName(branch)}</p>
                  <p className="text-xs text-muted-foreground">{tenantName}</p>
                  {branch.full_address && (
                    <p className="text-sm">{branch.full_address}</p>
                  )}
                </Popup>
              </Marker>
            ))}
            {missionLines
              .filter((line) => line.positions.length > 1)
              .map((line) => (
                <Polyline
                  key={line.key}
                  positions={line.positions}
                  color={MISSIONS_LINE_COLOR}
                  weight={4}
                >
                  <Popup>{line.title}</Popup>
                </Polyline>
              ))}
            {missionLines.map((line) => (
              <Marker
                key={`${line.key}-current`}
                position={line.positions[line.positions.length - 1]}
                icon={currentMissionIcon}
              >
                <Popup>{line.title}</Popup>
              </Marker>
            ))}
            {carLines
              .filter((line) => line.positions.length > 1)
              .map((line) => (
                <Polyline
                  key={line.key}
                  positions={line.positions}
                  color={line.isOnline ? CARS_LINE_COLOR : CAR_OFFLINE_COLOR}
                  weight={4}
                >
                  <Popup>{line.title}</Popup>
                </Polyline>
              ))}
            {carLines.map((line) => (
              <Marker
                key={`${line.key}-current`}
                position={line.positions[line.positions.length - 1]}
                icon={line.isOnline ? onlineCarIcon : offlineCarIcon}
              >
                <Popup>
                  <p className="font-medium">{line.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.tenantName}
                  </p>
                  <p className="text-sm">
                    {line.isOnline
                      ? t("online") || "Online"
                      : t("offline") || "Offline"}
                  </p>
                  {line.driverName && (
                    <p className="text-xs text-muted-foreground">
                      {t("driver") || "Driver"}: {line.driverName}
                    </p>
                  )}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {!isLoading && tenantBranches.length > 0 && (
          <div className="mt-4">
            <BranchReports />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
