"use client";

import {
  useState,
  useTransition,
} from "react";

import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  type GovernanceRecord,
  getApprovalCaseSteps,
  decideApprovalCase,
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
  cases: GovernanceRecord[];
};

type StepsMap = Record<
  string,
  GovernanceRecord[]
>;

type LoadingMap = Record<
  string,
  boolean
>;

type ApprovalDecision =
  | "APPROVE"
  | "REJECT"
  | "ABSTAIN"
  | "RECUSE"
  | "RETURN_FOR_CHANGES";

type ActiveDecision = {
  caseRecord: GovernanceRecord;
  stepRecord: GovernanceRecord;
} | null;

function label(
  record: GovernanceRecord,
): string {
  const candidates = [
    record.title,
    record.name,
    record.code,
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

export default function GovernanceApprovalsClient({
  cases,
}: Props) {
  const t = useTranslations(
    "governance.approvals"
  );

  const a = useTranslations(
    "governance.actions"
  );

  const router = useRouter();

  const canDecide =
    useCan(
      "workspace.enterprise_approval.decide",
    );

  const [
    stepsByCase,
    setStepsByCase,
  ] = useState<StepsMap>({});

  const [
    loadingByCase,
    setLoadingByCase,
  ] = useState<LoadingMap>({});

  const [
    activeDecision,
    setActiveDecision,
  ] = useState<ActiveDecision>(
    null,
  );

  const [
    decision,
    setDecision,
  ] = useState<ApprovalDecision>(
    "APPROVE",
  );

  const [
    reason,
    setReason,
  ] = useState("");

  const [
    conflictDeclared,
    setConflictDeclared,
  ] = useState(false);

  const [
    conflictNotes,
    setConflictNotes,
  ] = useState("");

  const [
    isPending,
    startTransition,
  ] = useTransition();

  async function loadSteps(
    casePublicId: string,
    force = false,
  ) {
    if (
      ! force
      && stepsByCase[
        casePublicId
      ]
    ) {
      return;
    }

    setLoadingByCase(
      (current) => ({
        ...current,
        [casePublicId]: true,
      }),
    );

    const result =
      await getApprovalCaseSteps(
        casePublicId,
      );

    setLoadingByCase(
      (current) => ({
        ...current,
        [casePublicId]: false,
      }),
    );

    if (! result.success) {
      toast.error(
        result.error || a("failed"),
      );

      return;
    }

    setStepsByCase(
      (current) => ({
        ...current,
        [casePublicId]:
          result.data ?? [],
      }),
    );
  }

  function resetDecision() {
    setActiveDecision(null);
    setDecision("APPROVE");
    setReason("");
    setConflictDeclared(false);
    setConflictNotes("");
  }

  function submitDecision() {
    if (! activeDecision) {
      return;
    }

    if (
      conflictDeclared
      && decision === "APPROVE"
    ) {
      toast.error(
        a(
          "conflict_cannot_approve",
        ),
      );

      return;
    }

    if (
      conflictDeclared
      && decision !== "RECUSE"
      && decision !== "ABSTAIN"
    ) {
      toast.error(
        a(
          "conflict_requires_recusal_or_abstention",
        ),
      );

      return;
    }

    const casePublicId =
      activeDecision
        .caseRecord
        .public_id;

    const stepPublicId =
      activeDecision
        .stepRecord
        .public_id;

    startTransition(
      async () => {
        const result =
          await decideApprovalCase(
            casePublicId,
            stepPublicId,
            {
              decision,
              reason:
                reason.trim()
                || null,
              conflict_declared:
                conflictDeclared,
              conflict_notes:
                conflictNotes
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
            "approval_decision_recorded",
          ),
        );

        await loadSteps(
          casePublicId,
          true,
        );

        resetDecision();
        router.refresh();
      },
    );
  }

  if (cases.length === 0) {
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
      {cases.map(
        (caseRecord) => {
          const caseId =
            caseRecord.public_id;

          const steps =
            stepsByCase[
              caseId
            ];

          const loading =
            loadingByCase[
              caseId
            ] ?? false;

          return (
            <Card key={caseId}>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle>
                      {label(
                        caseRecord,
                      )}
                    </CardTitle>

                    <CardDescription className="mt-1">
                      {caseId}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {caseRecord.status && (
                      <Badge variant="outline">
                        {String(
                          caseRecord.status,
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
                        void loadSteps(
                          caseId,
                        )
                      }
                    >
                      {loading
                        ? a("loading")
                        : a(
                            "view_approval_steps",
                          )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {steps && (
                <CardContent>
                  {steps.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {t(
                        "no_steps",
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {steps.map(
                        (step) => (
                          <div
                            key={
                              step.public_id
                            }
                            className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div>
                              <p className="font-medium">
                                {label(
                                  step,
                                )}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {
                                  step.public_id
                                }
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {step.status && (
                                <Badge variant="outline">
                                  {String(
                                    step.status,
                                  )}
                                </Badge>
                              )}

                              {canDecide && (
                                <Button
                                  size="sm"
                                  disabled={
                                    isPending
                                  }
                                  onClick={() => {
                                    setActiveDecision(
                                      {
                                        caseRecord,
                                        stepRecord:
                                          step,
                                      },
                                    );

                                    setDecision(
                                      "APPROVE",
                                    );
                                  }}
                                >
                                  {a(
                                    "decide",
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

      {activeDecision && (
        <AlertDialog
          open={
            activeDecision
            !== null
          }
          onOpenChange={(open) => {
            if (! open) {
              resetDecision();
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {a(
                  "approval_decision",
                )}
              </AlertDialogTitle>

              <AlertDialogDescription>
                {a(
                  "approval_decision_description",
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    "APPROVE",
                    "REJECT",
                    "ABSTAIN",
                    "RECUSE",
                    "RETURN_FOR_CHANGES",
                  ] as ApprovalDecision[]
                ).map(
                  (value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={
                        decision
                        === value
                          ? "default"
                          : "outline"
                      }
                      disabled={
                        conflictDeclared
                        && value
                          === "APPROVE"
                      }
                      onClick={() =>
                        setDecision(
                          value,
                        )
                      }
                    >
                      {a(
                        `decision_${value.toLowerCase()}`,
                      )}
                    </Button>
                  ),
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {a(
                    "decision_reason",
                  )}
                </label>

                <Textarea
                  value={reason}
                  maxLength={5000}
                  onChange={(event) =>
                    setReason(
                      event.target.value,
                    )
                  }
                  placeholder={
                    a(
                      "decision_reason_placeholder",
                    )
                  }
                />
              </div>

              <label className="flex items-start gap-3 rounded-lg border p-3">
                <input
                  type="checkbox"
                  checked={
                    conflictDeclared
                  }
                  onChange={(event) => {
                    const checked =
                      event.target
                        .checked;

                    setConflictDeclared(
                      checked,
                    );

                    if (
                      checked
                      && decision
                        === "APPROVE"
                    ) {
                      setDecision(
                        "RECUSE",
                      );
                    }
                  }}
                  className="mt-1 size-4"
                />

                <span className="space-y-1">
                  <span className="block text-sm font-medium">
                    {a(
                      "declare_conflict",
                    )}
                  </span>

                  <span className="block text-xs text-muted-foreground">
                    {a(
                      "declare_conflict_description",
                    )}
                  </span>
                </span>
              </label>

              {conflictDeclared && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {a(
                      "conflict_notes",
                    )}
                  </label>

                  <Textarea
                    value={
                      conflictNotes
                    }
                    maxLength={5000}
                    onChange={(event) =>
                      setConflictNotes(
                        event.target.value,
                      )
                    }
                    placeholder={
                      a(
                        "conflict_notes_placeholder",
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
                  || (
                    conflictDeclared
                    && decision
                      === "APPROVE"
                  )
                }
                onClick={
                  submitDecision
                }
              >
                {a(
                  "submit_decision",
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
