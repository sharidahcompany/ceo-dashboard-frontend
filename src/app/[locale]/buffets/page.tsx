import { getBuffets } from "@/actions/buffet/buffet.actions";
import Buffets from "@/components/features/buffet/Buffets";

export default async function Page() {
    const result = await getBuffets();
    const buffets = result.success ? result.data.data : [];
    return <Buffets buffets={buffets} />
}