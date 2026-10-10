"use client";

import {
  useState,
  useTransition,
} from "react";

import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  type GovernanceRecord,
  getGovernanceTransitionItems,
  handoverTransitionItem,
  acceptTransitionItem,
} from "@/actions/workspace/governance.actions";

import { useRouter } from "@/i18n/navigation";
import { useCan } from "@/providers/AbilityProvider";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  transitions: GovernanceRecord[];
};

type ItemsMap = Record<
  string,
  GovernanceRecord[]
>;

type LoadingMap = Record<
  string,
  boolean
>;

type ActiveItem = {
  transitionPublicId: string;
  item: GovernanceRecord;
} | null;

function label(
  record: GovernanceRecord,
): string {
  const candidates = [
    record.title,
    record.name,
    record.code,
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

  return record.public_id;
}

export default function GovernanceTransitionsClient({
  transitions,
}: Props) {
  const t = useTranslations(
    "governance.transitions"
  );

  const a = useTranslations(
    "governance.actions"
  );

  const router = useRouter();

  const canHandover =
    useCan(
      "workspace.governance_transition.handover",
    );

  const canAccept =
    useCan(
      "workspace.governance_transition.accept",
    );

  const [
    itemsByTransition,
    setItemsByTransition,
  ] = useState<ItemsMap>({});

  const [
    loadingByTransition,
    setLoadingByTransition,
  ] = useState<LoadingMap>({});

  const [
    handoverItem,
    setHandoverItem,
  ] = useState<ActiveItem>(null);

  const [
    acceptItem,
    setAcceptItem,
  ] = useState<ActiveItem>(null);

  const [
    handoverNotes,
    setHandoverNotes,
  ] = useState("");

  const [
    acceptanceNotes,
    setAcceptanceNotes,
  ] = useState("");

  const [
    reservationNotes,
    setReservationNotes,
  ] = useState("");

  const [
    withReservation,
    setWithReservation,
  ] = useState(false);

  const [
    isPending,
    startTransition,
  ] = useTransition();

  async function loadItems(
    transitionPublicId: string,
    force = false,
  ) {
    if (
      ! force
      && itemsByTransition[
        transitionPublicId
      ]
    ) {
      return;
    }

    setLoadingByTransition(
      (current) => ({
        ...current,
        [transitionPublicId]: true,
      }),
    );

    const result =
      await getGovernanceTransitionItems(
        transitionPublicId,
      );

    setLoadingByTransition(
      (current) => ({
        ...current,
        [transitionPublicId]: false,
      }),
    );

    if (! result.success) {
      toast.error(
        result.error || a("failed"),
      );

      return;
    }

    setItemsByTransition(
      (current) => ({
        ...current,
        [transitionPublicId]:
          result.data ?? [],
      }),
    );
  }

  function resetHandover() {
    setHandoverItem(null);
    setHandoverNotes("");
  }

  function resetAccept() {
    setAcceptItem(null);
    setAcceptanceNotes("");
    setReservationNotes("");
    setWithReservation(false);
  }

  function submitHandover() {
    if (! handoverItem) {
      return;
    }

    const transitionPublicId =
      handoverItem
        .transitionPublicId;

    const itemPublicId =
      handoverItem
        .item
        .public_id;

    startTransition(
      async () => {
        const result =
          await handoverTransitionItem(
            itemPublicId,
            {
              notes:
                handoverNotes.trim()
                || null,
              evidence_snapshot: {},
            },
          );

        if (! result.success) {
          toast.error(
            result.error
            || a("failed"),
          );

          return;
        }

        toast.success(
          a(
            "handover_recorded",
          ),
        );

        await loadItems(
          transitionPublicId,
          true,
        );

        resetHandover();
        router.refresh();
      },
    );
  }

  function submitAccept() {
    if (! acceptItem) {
      return;
    }

    const transitionPublicId =
      acceptItem
        .transitionPublicId;

    const itemPublicId =
      acceptItem
        .item
        .public_id;

    startTransition(
      async () => {
        const result =
          await acceptTransitionItem(
            itemPublicId,
            {
              with_reservation:
                withReservation,
              acceptance_notes:
                acceptanceNotes
                  .trim()
                || null,
              reservation_notes:
                reservationNotes
                  .trim()
                || null,
            },
          );

        if (! result.success) {
          toast.error(
            result.error
            || a("failed"),
          );

          return;
        }

        toast.success(
          a(
            "acceptance_recorded",
          ),
        );

        await loadItems(
          transitionPublicId,
          true,
        );

        resetAccept();
        router.refresh();
      },
    );
  }

  if (transitions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {t("title")}
          </CardTitle>

          <CardDescription>
            {t("description")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {transitions.map(
        (transition) => {
          const transitionId =
            transition.public_id;

          const items =
            itemsByTransition[
              transitionId
            ];

          const loading =
            loadingByTransition[
              transitionId
            ] ?? false;

          return (
            <Card
              key={
                transitionId
              }
            >
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>
                      {label(
                        transition,
                      )}
                    </CardTitle>

                    <CardDescription className="mt-1">
                      {transitionId}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {transition.status && (
                      <Badge variant="outline">
                        {String(
                          transition.status,
                        )}
                      </Badge>
                    )}

                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        loading
                        || isPending
                      }
                      onClick={() =>
                        void loadItems(
                          transitionId,
                        )
                      }
                    >
                      {loading
                        ? a("loading")
                        : a(
                            "view_transition_items",
                          )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {items && (
                <CardContent>
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {t(
                        "no_items",
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map(
                        (item) => (
                          <div
                            key={
                              item.public_id
                            }
                            className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div>
                              <p className="font-medium">
                                {label(
                                  item,
                                )}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {
                                  item.public_id
                                }
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {item.status && (
                                <Badge variant="outline">
                                  {String(
                                    item.status,
                                  )}
                                </Badge>
                              )}

                              {canHandover && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={
                                    isPending
                                  }
                                  onClick={() =>
                                    setHandoverItem(
                                      {
                                        transitionPublicId:
                                          transitionId,
                                        item,
                                      },
                                    )
                                  }
                                >
                                  {a(
                                    "handover",
                                  )}
                                </Button>
                              )}

                              {canAccept && (
                                <Button
                                  size="sm"
                                  disabled={
                                    isPending
                                  }
                                  onClick={() =>
                                    setAcceptItem(
                                      {
                                        transitionPublicId:
                                          transitionId,
                                        item,
                                      },
                                    )
                                  }
                                >
                                  {a(
                                    "accept_handover",
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        },
      )}

      {handoverItem && (
        <AlertDialog
          open={
            handoverItem !== null
          }
          onOpenChange={(open) => {
            if (! open) {
              resetHandover();
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {a(
                  "handover_item",
                )}
              </AlertDialogTitle>

              <AlertDialogDescription>
                {a(
                  "handover_description",
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {a(
                  "handover_notes",
                )}
              </label>

              <Textarea
                value={
                  handoverNotes
                }
                onChange={(event) =>
                  setHandoverNotes(
                    event.target.value,
                  )
                }
                placeholder={
                  a(
                    "handover_notes_placeholder",
                  )
                }
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>
                {a("cancel")}
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={
                  isPending
                }
                onClick={
                  submitHandover
                }
              >
                {a(
                  "confirm_handover",
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {acceptItem && (
        <AlertDialog
          open={
            acceptItem !== null
          }
          onOpenChange={(open) => {
            if (! open) {
              resetAccept();
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {a(
                  "accept_handover",
                )}
              </AlertDialogTitle>

              <AlertDialogDescription>
                {a(
                  "accept_handover_description",
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {a(
                    "acceptance_notes",
                  )}
                </label>

                <Textarea
                  value={
                    acceptanceNotes
                  }
                  onChange={(event) =>
                    setAcceptanceNotes(
                      event.target.value,
                    )
                  }
                  placeholder={
                    a(
                      "acceptance_notes_placeholder",
                    )
                  }
                />
              </div>

              <label className="flex items-start gap-3 rounded-lg border p-3">
                <input
                  type="checkbox"
                  checked={
                    withReservation
                  }
                  onChange={(event) =>
                    setWithReservation(
                      event.target.checked,
                    )
                  }
                  className="mt-1 size-4"
                />

                <span className="space-y-1">
                  <span className="block text-sm font-medium">
                    {a(
                      "accept_with_reservation",
                    )}
                  </span>

                  <span className="block text-xs text-muted-foreground">
                    {a(
                      "accept_with_reservation_description",
                    )}
                  </span>
                </span>
              </label>

              {withReservation && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {a(
                      "reservation_notes",
                    )}
                  </label>

                  <Textarea
                    value={
                      reservationNotes
                    }
                    onChange={(event) =>
                      setReservationNotes(
                        event.target.value,
                      )
                    }
                    placeholder={
                      a(
                        "reservation_notes_placeholder",
                      )
                    }
                  />
                </div>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>
                {a("cancel")}
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={
                  isPending
                }
                onClick={
                  submitAccept
                }
              >
                {a(
                  "confirm_acceptance",
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
