"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export interface SignatureCanvasHandle {
    /** null when nothing has been drawn yet. */
    toDataUrl: () => string | null;
    clear: () => void;
    isEmpty: () => boolean;
}

export interface SignatureCanvasProps {
    height?: number;
}

/**
 * A minimal signature pad: pointer events, quadratic-curve smoothing, and a
 * transparent background. No dependency — signature capture is simple enough
 * that a canvas library would be more surface area than the feature itself.
 *
 * Rendered at devicePixelRatio*3 internally so a signature drawn small on a
 * phone still prints legibly once inlined into a PDF at document scale.
 */
const SignatureCanvas = forwardRef<SignatureCanvasHandle, SignatureCanvasProps>(
    function SignatureCanvas({ height = 180 }, ref) {
        const t = useTranslations();
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const drawing = useRef(false);
        const hasInk = useRef(false);
        const lastPoint = useRef<{ x: number; y: number } | null>(null);
        const [isEmpty, setIsEmpty] = useState(true);

        // Set up the backing bitmap at a high resolution once we know the
        // container's CSS size, so strokes stay crisp regardless of screen DPI.
        useEffect(() => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            const scale = Math.max(window.devicePixelRatio || 1, 1) * 3;
            const width = container.clientWidth;

            canvas.width = width * scale;
            canvas.height = height * scale;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.scale(scale, scale);
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.strokeStyle = "#111827";
                ctx.lineWidth = 2.2;
            }
        }, [height]);

        useImperativeHandle(ref, () => ({
            toDataUrl: () => {
                if (!hasInk.current || !canvasRef.current) return null;
                return canvasRef.current.toDataURL("image/png");
            },
            clear: () => {
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext("2d");
                if (canvas && ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                hasInk.current = false;
                setIsEmpty(true);
            },
            isEmpty: () => !hasInk.current,
        }));

        const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
            const rect = canvasRef.current!.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };

        const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drawing.current = true;
            lastPoint.current = pointFromEvent(e);
        };

        const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
            if (!drawing.current) return;
            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx || !lastPoint.current) return;

            const point = pointFromEvent(e);
            const mid = {
                x: (lastPoint.current.x + point.x) / 2,
                y: (lastPoint.current.y + point.y) / 2,
            };

            ctx.beginPath();
            ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
            ctx.quadraticCurveTo(mid.x, mid.y, point.x, point.y);
            ctx.stroke();

            lastPoint.current = point;
            hasInk.current = true;
            setIsEmpty(false);
        };

        const end = () => {
            drawing.current = false;
            lastPoint.current = null;
        };

        return (
            <div className="space-y-2">
                {/* dir="ltr" always: a signature stroke must never be mirrored
                    by the page's RTL direction. */}
                <div
                    ref={containerRef}
                    dir="ltr"
                    className="w-full rounded-md border border-dashed bg-white touch-none"
                    style={{ height }}
                >
                    <canvas
                        ref={canvasRef}
                        className="cursor-crosshair"
                        onPointerDown={start}
                        onPointerMove={move}
                        onPointerUp={end}
                        onPointerLeave={end}
                    />
                </div>
                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        disabled={isEmpty}
                        onClick={() => {
                            const canvas = canvasRef.current;
                            const ctx = canvas?.getContext("2d");
                            if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                            hasInk.current = false;
                            setIsEmpty(true);
                        }}
                    >
                        <RotateCcw className="size-3.5" />
                        {t("buttons.clear")}
                    </Button>
                </div>
            </div>
        );
    },
);

export default SignatureCanvas;
