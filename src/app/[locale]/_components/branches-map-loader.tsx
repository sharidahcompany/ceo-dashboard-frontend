"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const BranchesMap = dynamic(() => import("./branches-map").then((mod) => mod.BranchesMap), {
    ssr: false,
    loading: () => <Skeleton className="h-96 w-full rounded-xl" />,
});

export function BranchesMapLoader() {
    return <BranchesMap />;
}
