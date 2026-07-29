import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";


export default function Loading() {
    return (<Card>
        <CardContent className="flex items-center justify-center min-h-[500px]">
            <Spinner />
        </CardContent>
    </Card>);
}