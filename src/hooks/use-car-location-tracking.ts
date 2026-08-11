"use client";

import { useEffect, useRef, useState } from "react";
import {
  CarLocationPoint,
  saveCarLocations,
} from "@/actions/workspace/cars.actions";

const FLUSH_INTERVAL_MS = 15000;

/**
 * Watches the device's GPS position via navigator.geolocation.watchPosition
 * while `enabled` is true, buffering points and flushing them to the backend
 * every FLUSH_INTERVAL_MS so a car's journey can be replayed later. Mirrors
 * useMissionLocationTracking — see that hook for the backgrounding/closed-tab
 * caveats, which apply identically here.
 */
export function useCarLocationTracking(
  carId: number | string | undefined,
  enabled: boolean,
) {
  const [error, setError] = useState<string | null>(null);
  const [lastPoint, setLastPoint] = useState<CarLocationPoint | null>(null);
  const bufferRef = useRef<CarLocationPoint[]>([]);

  useEffect(() => {
    if (!enabled || !carId) return;

    if (!("geolocation" in navigator)) {
      setError("geolocation_unsupported");
      return;
    }

    const flush = () => {
      if (bufferRef.current.length === 0) return;
      const points = bufferRef.current;
      bufferRef.current = [];
      saveCarLocations(carId, points).then((res) => {
        if (!res.success) setError(res.error);
      });
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const point: CarLocationPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
          recorded_at: new Date(position.timestamp).toISOString(),
        };
        bufferRef.current.push(point);
        setLastPoint(point);
        setError(null);
      },
      (geoError) => setError(geoError.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );

    const intervalId = window.setInterval(flush, FLUSH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId, enabled]);

  return { lastPoint, error };
}
