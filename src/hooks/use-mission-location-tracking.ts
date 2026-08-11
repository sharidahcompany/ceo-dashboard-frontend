"use client";

import { useEffect, useRef, useState } from "react";
import {
  MissionLocationPoint,
  saveMissionLocations,
} from "@/actions/workspace/missions.actions";

const FLUSH_INTERVAL_MS = 15000;

/**
 * Watches the device's GPS position via navigator.geolocation.watchPosition
 * while `enabled` is true, buffering points and flushing them to the backend
 * every FLUSH_INTERVAL_MS so a mission's journey can be replayed later.
 * Stops the watch and flushes any remaining buffered points as soon as
 * `enabled` turns false (mission completed/cancelled or left in_progress).
 *
 * Keeps running while the tab is merely backgrounded (switched away from or
 * the screen is locked with the browser still open) since neither
 * watchPosition nor the flush timer are tied to page visibility. There is no
 * way to keep this running once the tab/browser is actually closed — that
 * requires a native app with background location permissions. Browsers also
 * throttle timers in backgrounded tabs (Chrome can drop this to ~once/minute
 * after a while), so the 5s cadence is a best-effort target, not a guarantee,
 * while backgrounded.
 */
export function useMissionLocationTracking(
  missionId: number | string | undefined,
  enabled: boolean,
) {
  const [error, setError] = useState<string | null>(null);
  const [lastPoint, setLastPoint] = useState<MissionLocationPoint | null>(
    null,
  );
  const bufferRef = useRef<MissionLocationPoint[]>([]);

  useEffect(() => {
    if (!enabled || !missionId) return;

    if (!("geolocation" in navigator)) {
      setError("geolocation_unsupported");
      return;
    }

    const flush = () => {
      if (bufferRef.current.length === 0) return;
      const points = bufferRef.current;
      bufferRef.current = [];
      saveMissionLocations(missionId, points).then((res) => {
        if (!res.success) setError(res.error);
      });
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const point: MissionLocationPoint = {
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

    // Flush immediately on backgrounding rather than waiting for the next
    // tick, since browsers throttle timers heavily once a tab is hidden.
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
  }, [missionId, enabled]);

  return { lastPoint, error };
}
