"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { AuthSidebarItem } from "../layout/AuthSidebar";

export interface ThreeDMarqueeProps {
  images?: string[];
  colors?: string[];
  className?: string;
  reverse?: boolean;
  items?: AuthSidebarItem[];
}

export const ThreeDMarquee = ({
  items,
  className,
  reverse = false,
}: ThreeDMarqueeProps) => {
  // Split into 4 columns
  const columns: AuthSidebarItem[][] = [[], [], [], []];
  items?.forEach((item, i) => {
    columns[i % 4].push(item);
  });

  return (
    <div className={cn("relative h-full w-full overflow-hidden  ", className)}>
      {/* Perspective container - centered with large overflow */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          perspective: "1000px",
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* 3D transformed grid - made very large to cover after rotation */}
        <div
          className="grid grid-cols-4 gap-6"
          style={{
            transform: `rotateX(60deg) rotateZ(${reverse ? "45deg" : "-45deg"})`,
            transformStyle: "preserve-3d",
            width: "300vmax",
            height: "300vmax",
          }}
        >
          {columns.map((column, colIndex) => (
            <motion.div
              key={colIndex}
              className="flex flex-col gap-6"
              animate={{
                y: colIndex % 2 === 0 ? ["0%", "-50%"] : ["-50%", "0%"],
              }}
              transition={{
                duration: colIndex % 2 === 0 ? 20 : 25,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              {/* Triple items for seamless loop */}
              {[...column, ...column, ...column].map((item, itemIndex) => (
                <motion.div
                  key={itemIndex}
                  className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-2xl shadow-xl bg-chart-1 dark:bg-yellow-400"
                  style={{
                    minHeight: "20vmax",
                  }}
                >
                  <div className="w-full h-full flex flex-col justify-center items-center gap-10 text-8xl text-center">
                    {item.icon}

                    <p>{item.title}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Gradient overlays for fade effect */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-transparent to-background" />
      {/* <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-background via-transparent to-background" /> */}
    </div>
  );
};
