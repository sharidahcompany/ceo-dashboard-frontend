import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GovernanceRecord } from "@/actions/workspace/governance.actions";

type GovernanceRecordListProps = {
  title: string;
  description: string;
  records: GovernanceRecord[];
  emptyText: string;
};

function primaryLabel(
  record: GovernanceRecord,
): string {
  const candidates = [
    record.name,
    record.title,
    record.body_code,
    record.election_code,
    record.term_code,
    record.public_id,
  ];

  for (const value of candidates) {
    if (
      typeof value === "string"
      && value.trim() !== ""
    ) {
      return value;
    }
  }

  return "-";
}

export default function GovernanceRecordList({
  title,
  description,
  records,
  emptyText,
}: GovernanceRecordListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {records.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.public_id}
                className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {primaryLabel(record)}
                  </p>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {record.public_id}
                  </p>
                </div>

                {record.status && (
                  <Badge variant="outline">
                    {String(record.status)}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
