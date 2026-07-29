import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface LoadingCardsProps {
    count?: number;
}

export default function LoadingCards({ count = 6 }: LoadingCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex flex-col items-center justify-center gap-y-3">
                            <Skeleton className="h-12 w-12 rounded-full" />

                            <Skeleton className="h-4 w-1/2 mt-1" />

                            <Skeleton className="h-3 w-4/5" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}