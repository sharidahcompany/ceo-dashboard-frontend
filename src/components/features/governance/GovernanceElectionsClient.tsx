"use client";

import {
  useState,
  useTransition,
} from "react";

import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  type GovernanceRecord,
  getGovernanceElectionCandidates,
  publishCandidateProgram,
  finalizeGovernanceCandidate,
  openElectionVoting,
  castElectionBallot,
  certifyElectionResults,
} from "@/actions/workspace/governance.actions";

import { useRouter } from "@/i18n/navigation";
import { useCan } from "@/providers/AbilityProvider";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  elections: GovernanceRecord[];
};

type CandidateMap = Record<
  string,
  GovernanceRecord[]
>;

type LoadingMap = Record<
  string,
  boolean
>;

function label(
  record: GovernanceRecord,
): string {
  const candidates = [
    record.title,
    record.name,
    record.code,
    record.election_code,
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

export default function GovernanceElectionsClient({
  elections,
}: Props) {
  const t = useTranslations(
    "governance.elections"
  );

  const a = useTranslations(
    "governance.actions"
  );

  const router = useRouter();

  const canPublishProgram =
    useCan(
      "workspace.governance_program.publish",
    );

  const canUpdateElection =
    useCan(
      "workspace.governance_election.update",
    );

  const canOpenVoting =
    useCan(
      "workspace.governance_election.open_voting",
    );

  const canVote =
    useCan(
      "workspace.governance_election.vote",
    );

  const canCertify =
    useCan(
      "workspace.governance_election.certify",
    );

  const [
    candidatesByElection,
    setCandidatesByElection,
  ] = useState<CandidateMap>({});

  const [
    loadingByElection,
    setLoadingByElection,
  ] = useState<LoadingMap>({});

  const [
    ballotElection,
    setBallotElection,
  ] = useState<GovernanceRecord | null>(
    null,
  );

  const [
    selectedCandidateIds,
    setSelectedCandidateIds,
  ] = useState<string[]>([]);

  const [
    isPending,
    startTransition,
  ] = useTransition();

  async function loadCandidates(
    electionPublicId: string,
    force = false,
  ) {
    if (
      ! force
      && candidatesByElection[
        electionPublicId
      ]
    ) {
      return;
    }

    setLoadingByElection(
      (current) => ({
        ...current,
        [electionPublicId]: true,
      }),
    );

    const result =
      await getGovernanceElectionCandidates(
        electionPublicId,
      );

    setLoadingByElection(
      (current) => ({
        ...current,
        [electionPublicId]: false,
      }),
    );

    if (! result.success) {
      toast.error(
        result.error || a("failed"),
      );

      return;
    }

    setCandidatesByElection(
      (current) => ({
        ...current,
        [electionPublicId]:
          result.data ?? [],
      }),
    );
  }

  function run(
    action: () => Promise<{
      success: boolean;
      error?: string;
    }>,
    successMessage: string,
    electionPublicId?: string,
  ) {
    startTransition(
      async () => {
        const result =
          await action();

        if (! result.success) {
          toast.error(
            result.error || a("failed"),
          );

          return;
        }

        toast.success(
          successMessage,
        );

        if (electionPublicId) {
          await loadCandidates(
            electionPublicId,
            true,
          );
        }

        router.refresh();
      },
    );
  }

  function toggleCandidate(
    candidatePublicId: string,
    maximumChoices: number,
  ) {
    setSelectedCandidateIds(
      (current) => {
        if (
          current.includes(
            candidatePublicId,
          )
        ) {
          return current.filter(
            (id) =>
              id !== candidatePublicId,
          );
        }

        if (
          maximumChoices > 0
          && current.length
            >= maximumChoices
        ) {
          toast.error(
            a(
              "ballot_choice_limit",
              {
                count:
                  maximumChoices,
              },
            ),
          );

          return current;
        }

        return [
          ...current,
          candidatePublicId,
        ];
      },
    );
  }

  function submitBallot() {
    if (! ballotElection) {
      return;
    }

    if (
      selectedCandidateIds.length
      === 0
    ) {
      toast.error(
        a(
          "ballot_requires_candidate",
        ),
      );

      return;
    }

    const electionId =
      ballotElection.public_id;

    run(
      () =>
        castElectionBallot(
          electionId,
          selectedCandidateIds,
        ),
      a("ballot_submitted"),
      electionId,
    );

    setBallotElection(null);
    setSelectedCandidateIds([]);
  }

  if (elections.length === 0) {
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
      {elections.map(
        (election) => {
          const electionId =
            election.public_id;

          const candidates =
            candidatesByElection[
              electionId
            ];

          const loading =
            loadingByElection[
              electionId
            ] ?? false;

          const rawMaximum =
            election[
              "maximum_choices_per_ballot"
            ];

          const maximumChoices =
            typeof rawMaximum === "number"
              ? rawMaximum
              : Number(
                  rawMaximum ?? 1,
                ) || 1;

          return (
            <Card key={electionId}>
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <CardTitle>
                      {label(election)}
                    </CardTitle>

                    <CardDescription className="mt-1">
                      {electionId}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {election.status && (
                      <Badge variant="outline">
                        {String(
                          election.status,
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
                        void loadCandidates(
                          electionId,
                        )
                      }
                    >
                      {loading
                        ? a("loading")
                        : a(
                            "view_candidates",
                          )}
                    </Button>

                    {canOpenVoting && (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                isPending
                              }
                            />
                          }
                        >
                          {a(
                            "open_election_voting",
                          )}
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {a(
                                "confirm_open_election_voting",
                              )}
                            </AlertDialogTitle>

                            <AlertDialogDescription>
                              {a(
                                "confirm_action_description",
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {a("cancel")}
                            </AlertDialogCancel>

                            <AlertDialogAction
                              disabled={
                                isPending
                              }
                              onClick={() =>
                                run(
                                  () =>
                                    openElectionVoting(
                                      electionId,
                                    ),
                                  a(
                                    "election_voting_opened",
                                  ),
                                )
                              }
                            >
                              {a("confirm")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {canVote && (
                      <Button
                        size="sm"
                        disabled={
                          isPending
                        }
                        onClick={async () => {
                          await loadCandidates(
                            electionId,
                          );

                          setSelectedCandidateIds(
                            [],
                          );

                          setBallotElection(
                            election,
                          );
                        }}
                      >
                        {a("cast_ballot")}
                      </Button>
                    )}

                    {canCertify && (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                isPending
                              }
                            />
                          }
                        >
                          {a(
                            "certify_election",
                          )}
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {a(
                                "confirm_certify_election",
                              )}
                            </AlertDialogTitle>

                            <AlertDialogDescription>
                              {a(
                                "confirm_action_description",
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {a("cancel")}
                            </AlertDialogCancel>

                            <AlertDialogAction
                              disabled={
                                isPending
                              }
                              onClick={() =>
                                run(
                                  () =>
                                    certifyElectionResults(
                                      electionId,
                                    ),
                                  a(
                                    "election_certified",
                                  ),
                                )
                              }
                            >
                              {a("confirm")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>

              {candidates && (
                <CardContent>
                  {candidates.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {t(
                        "no_candidates",
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {candidates.map(
                        (candidate) => (
                          <div
                            key={
                              candidate.public_id
                            }
                            className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="font-medium">
                                {label(
                                  candidate,
                                )}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {
                                  candidate.public_id
                                }
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {candidate.status && (
                                <Badge variant="outline">
                                  {String(
                                    candidate.status,
                                  )}
                                </Badge>
                              )}

                              {canPublishProgram && (
                                <AlertDialog>
                                  <AlertDialogTrigger
                                    render={
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={
                                          isPending
                                        }
                                      />
                                    }
                                  >
                                    {a(
                                      "publish_program",
                                    )}
                                  </AlertDialogTrigger>

                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {a(
                                          "confirm_publish_program",
                                        )}
                                      </AlertDialogTitle>

                                      <AlertDialogDescription>
                                        {a(
                                          "confirm_action_description",
                                        )}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        {a(
                                          "cancel",
                                        )}
                                      </AlertDialogCancel>

                                      <AlertDialogAction
                                        disabled={
                                          isPending
                                        }
                                        onClick={() =>
                                          run(
                                            () =>
                                              publishCandidateProgram(
                                                candidate.public_id,
                                              ),
                                            a(
                                              "program_published",
                                            ),
                                            electionId,
                                          )
                                        }
                                      >
                                        {a(
                                          "confirm",
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}

                              {canUpdateElection && (
                                <AlertDialog>
                                  <AlertDialogTrigger
                                    render={
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={
                                          isPending
                                        }
                                      />
                                    }
                                  >
                                    {a(
                                      "finalize_candidate",
                                    )}
                                  </AlertDialogTrigger>

                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {a(
                                          "confirm_finalize_candidate",
                                        )}
                                      </AlertDialogTitle>

                                      <AlertDialogDescription>
                                        {a(
                                          "confirm_action_description",
                                        )}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        {a(
                                          "cancel",
                                        )}
                                      </AlertDialogCancel>

                                      <AlertDialogAction
                                        disabled={
                                          isPending
                                        }
                                        onClick={() =>
                                          run(
                                            () =>
                                              finalizeGovernanceCandidate(
                                                candidate.public_id,
                                                {},
                                              ),
                                            a(
                                              "candidate_finalized",
                                            ),
                                            electionId,
                                          )
                                        }
                                      >
                                        {a(
                                          "confirm",
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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

      {ballotElection && (
        <AlertDialog
          open={
            ballotElection !== null
          }
          onOpenChange={(open) => {
            if (! open) {
              setBallotElection(null);
              setSelectedCandidateIds(
                [],
              );
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {a("cast_ballot")}
              </AlertDialogTitle>

              <AlertDialogDescription>
                {a(
                  "ballot_description",
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {(
                candidatesByElection[
                  ballotElection.public_id
                ] ?? []
              ).map(
                (candidate) => {
                  const selected =
                    selectedCandidateIds
                      .includes(
                        candidate.public_id,
                      );

                  const rawMaximum =
                    ballotElection[
                      "maximum_choices_per_ballot"
                    ];

                  const maximumChoices =
                    typeof rawMaximum
                      === "number"
                      ? rawMaximum
                      : Number(
                          rawMaximum
                          ?? 1,
                        ) || 1;

                  return (
                    <button
                      key={
                        candidate.public_id
                      }
                      type="button"
                      onClick={() =>
                        toggleCandidate(
                          candidate.public_id,
                          maximumChoices,
                        )
                      }
                      className={[
                        "flex w-full items-center justify-between rounded-lg border p-3 text-start transition-colors",
                        selected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50",
                      ].join(" ")}
                    >
                      <span>
                        <span className="block font-medium">
                          {label(
                            candidate,
                          )}
                        </span>

                        <span className="mt-1 block text-xs text-muted-foreground">
                          {
                            candidate.public_id
                          }
                        </span>
                      </span>

                      <span
                        className={[
                          "size-4 rounded-full border",
                          selected
                            ? "border-primary bg-primary"
                            : "",
                        ].join(" ")}
                      />
                    </button>
                  );
                },
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {a(
                "selected_candidates",
                {
                  count:
                    selectedCandidateIds
                      .length,
                },
              )}
            </p>

            <AlertDialogFooter>
              <AlertDialogCancel>
                {a("cancel")}
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={
                  isPending
                  || selectedCandidateIds
                    .length === 0
                }
                onClick={
                  submitBallot
                }
              >
                {a(
                  "submit_ballot",
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
