import { getBuffet } from "@/actions/buffet/buffet.actions";
import BuffetDetail from "@/components/features/buffet/BuffetDetail";

export default async function BuffetDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getBuffet(id);
    if (!result.success) return <div>Error loading buffet: {result.error}</div>;

    return <BuffetDetail buffet={result.data.data} />;
}
