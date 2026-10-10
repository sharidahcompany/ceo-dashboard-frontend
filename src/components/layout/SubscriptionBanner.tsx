import {
  getCurrentSubscriptionInteraction,
} from "@/actions/workspace/organization.actions";
import {
  AlertTriangle,
  Clock3,
} from "lucide-react";

type Props = {
  locale: string;
};

function formatDeadline(
  value: string | null | undefined,
  locale: string,
): string | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Riyadh",
    },
  ).format(date);
}

export default async function SubscriptionBanner({
  locale,
}: Props) {
  const result =
    await getCurrentSubscriptionInteraction();

  if (
    !result.success
    || !result.data
    || !result.data.warning
    || !result.data.presentation
  ) {
    return null;
  }

  const state = result.data.state;

  if (
    state !== "GRACE"
    && state !== "READ_ONLY"
  ) {
    return null;
  }

  const isArabic = locale === "ar";

  const message = isArabic
    ? result.data.presentation.message_ar
    : result.data.presentation.message_en;

  const deadline = formatDeadline(
    result.data.grace_ends_at,
    locale,
  );

  const renewalUrl =
    process.env.NEXT_PUBLIC_SUBSCRIPTIONS_URL;

  const blocking =
    state === "READ_ONLY";

  return (
    <div
      role="status"
      className={
        blocking
          ? "border-b border-destructive/30 bg-destructive/10 px-5 py-3"
          : "border-b border-warning/30 bg-warning/10 px-5 py-3"
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <AlertTriangle
          className={
            blocking
              ? "size-5 shrink-0 text-destructive"
              : "size-5 shrink-0 text-warning-foreground"
          }
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {message}
          </p>

          {deadline && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock3 className="size-3.5" />

              {blocking
                ? isArabic
                  ? `انتهت مهلة التجديد: ${deadline}`
                  : `Renewal grace period ended: ${deadline}`
                : isArabic
                  ? `تنتهي مهلة التجديد: ${deadline}`
                  : `Renewal grace period ends: ${deadline}`}
            </p>
          )}
        </div>

        {renewalUrl && (
          <a
            href={renewalUrl}
            className={
              blocking
                ? "inline-flex h-9 items-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground"
                : "inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            }
          >
            {isArabic
              ? "تجديد الاشتراك"
              : "Renew subscription"}
          </a>
        )}
      </div>
    </div>
  );
}
