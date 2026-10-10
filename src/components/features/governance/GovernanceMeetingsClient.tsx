"use client";

import {
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  getGovernanceMeetingResolutions,
  openGovernanceMeeting,
  openGovernanceResolution,
  closeGovernanceResolution,
  voteGovernanceResolution,
  type GovernanceRecord,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  meetings: GovernanceRecord[];
};

type ResolutionMap = Record<
  string,
  GovernanceRecord[]
>;

type LoadingMap = Record<
  string,
  boolean
>;

type VoteChoice =
  | "APPROVE"
  | "REJECT"
  | "ABSTAIN"
  | "RECUSE";


function recordLabel(
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

export default function GovernanceMeetingsClient({
  meetings,
}: Props) {
  const t = useTranslations(
    "governance.meetings"
  );

  const common = useTranslations(
    "governance.actions"
  );

  const router = useRouter();

  const canOpen =
    useCan(
      "workspace.governance_meeting.open",
    );

  const canClose =
    useCan(
      "workspace.governance_meeting.close",
    );

  const canVote =
    useCan(
      "workspace.governance_meeting.vote",
    );

  const [
    resolutionsByMeeting,
    setResolutionsByMeeting,
  ] = useState<ResolutionMap>({});

  const [
    loadingByMeeting,
    setLoadingByMeeting,
  ] = useState<LoadingMap>({});

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    voteDialogResolution,
    setVoteDialogResolution,
  ] = useState<GovernanceRecord | null>(
    null,
  );

  const [
    voteChoice,
    setVoteChoice,
  ] = useState<VoteChoice>(
    "APPROVE",
  );

  const [
    voteReason,
    setVoteReason,
  ] = useState("");

  const [
    conflictDeclared,
    setConflictDeclared,
  ] = useState(false);

  const [
    conflictNotes,
    setConflictNotes,
  ] = useState("");

  async function loadResolutions(
    meetingPublicId: string,
    force = false,
  ) {
    if (
      ! force
      && resolutionsByMeeting[
        meetingPublicId
      ]
    ) {
      return;
    }

    setLoadingByMeeting(
      (current) => ({
        ...current,
        [meetingPublicId]: true,
      }),
    );

    const result =
      await getGovernanceMeetingResolutions(
        meetingPublicId,
      );

    setLoadingByMeeting(
      (current) => ({
        ...current,
        [meetingPublicId]: false,
      }),
    );

    if (! result.success) {
      toast.error(
        result.error
        || common("failed"),
      );

      return;
    }

    setResolutionsByMeeting(
      (current) => ({
        ...current,
        [meetingPublicId]:
          result.data ?? [],
      }),
    );
  }

  function execute(
    action: () => Promise<{
      success: boolean;
      error?: string;
    }>,
    successMessage: string,
    meetingPublicId?: string,
  ) {
    startTransition(
      async () => {
        const result =
          await action();

        if (! result.success) {
          toast.error(
            result.error
            || common("failed"),
          );

          return;
        }

        toast.success(
          successMessage,
        );

        if (meetingPublicId) {
          await loadResolutions(
            meetingPublicId,
            true,
          );
        }

        router.refresh();
      },
    );
  }


  function submitVote(
    meetingPublicId: string,
  ) {
    const resolution =
      voteDialogResolution;

    if (! resolution) {
      return;
    }

    if (
      conflictDeclared
      && voteChoice === "APPROVE"
    ) {
      toast.error(
        common(
          "conflict_cannot_approve",
        ),
      );

      return;
    }

    if (
      conflictDeclared
      && voteChoice !== "RECUSE"
      && voteChoice !== "ABSTAIN"
    ) {
      toast.error(
        common(
          "conflict_requires_recusal_or_abstention",
        ),
      );

      return;
    }

    execute(
      () =>
        voteGovernanceResolution(
          resolution.public_id,
          {
            vote: voteChoice,
            reason:
              voteReason.trim() || null,
            conflict_declared:
              conflictDeclared,
            conflict_notes:
              conflictNotes.trim()
              || null,
          },
        ),
      common("vote_recorded"),
      meetingPublicId,
    );

    setVoteDialogResolution(null);
    setVoteReason("");
    setConflictDeclared(false);
    setConflictNotes("");
    setVoteChoice("APPROVE");
  }

  if (meetings.length === 0) {
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
      {meetings.map(
        (meeting) => {
          const id =
            meeting.public_id;

          const resolutions =
            resolutionsByMeeting[id];

          const loading =
            loadingByMeeting[id]
            ?? false;

          return (
            <Card key={id}>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <CardTitle>
                      {recordLabel(
                        meeting,
                      )}
                    </CardTitle>

                    <CardDescription className="mt-1">
                      {id}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {meeting.status && (
                      <Badge variant="outline">
                        {String(
                          meeting.status,
                        )}
                      </Badge>
                    )}

                    {canOpen && (
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
                          {common(
                            "open_meeting",
                          )}
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {common(
                                "confirm_open_meeting",
                              )}
                            </AlertDialogTitle>

                            <AlertDialogDescription>
                              {common(
                                "confirm_action_description",
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {common(
                                "cancel",
                              )}
                            </AlertDialogCancel>

                            <AlertDialogAction
                              disabled={
                                isPending
                              }
                              onClick={() =>
                                execute(
                                  () =>
                                    openGovernanceMeeting(
                                      id,
                                    ),
                                  common(
                                    "meeting_opened",
                                  ),
                                )
                              }
                            >
                              {common(
                                "confirm",
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        loading
                        || isPending
                      }
                      onClick={() =>
                        void loadResolutions(
                          id,
                        )
                      }
                    >
                      {loading
                        ? common(
                            "loading",
                          )
                        : common(
                            "view_resolutions",
                          )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {resolutions && (
                <CardContent>
                  {resolutions.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {t(
                        "no_resolutions",
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {resolutions.map(
                        (resolution) => (
                          <div
                            key={
                              resolution.public_id
                            }
                            className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="font-medium">
                                {recordLabel(
                                  resolution,
                                )}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {
                                  resolution.public_id
                                }
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {resolution.status && (
                                <Badge variant="outline">
                                  {String(
                                    resolution.status,
                                  )}
                                </Badge>
                              )}

                              {canOpen && (
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
                                    {common(
                                      "open_resolution",
                                    )}
                                  </AlertDialogTrigger>

                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {common(
                                          "confirm_open_resolution",
                                        )}
                                      </AlertDialogTitle>

                                      <AlertDialogDescription>
                                        {common(
                                          "confirm_action_description",
                                        )}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        {common(
                                          "cancel",
                                        )}
                                      </AlertDialogCancel>

                                      <AlertDialogAction
                                        disabled={
                                          isPending
                                        }
                                        onClick={() =>
                                          execute(
                                            () =>
                                              openGovernanceResolution(
                                                resolution.public_id,
                                              ),
                                            common(
                                              "resolution_opened",
                                            ),
                                            id,
                                          )
                                        }
                                      >
                                        {common(
                                          "confirm",
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}

                              {canVote && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={
                                    isPending
                                  }
                                  onClick={() =>
                                    setVoteDialogResolution(
                                      resolution,
                                    )
                                  }
                                >
                                  {common(
                                    "vote",
                                  )}
                                </Button>
                              )}

                              {canClose && (
                                <AlertDialog>
                                  <AlertDialogTrigger
                                    render={
                                      <Button
                                        size="sm"
                                        disabled={
                                          isPending
                                        }
                                      />
                                    }
                                  >
                                    {common(
                                      "close_resolution",
                                    )}
                                  </AlertDialogTrigger>

                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {common(
                                          "confirm_close_resolution",
                                        )}
                                      </AlertDialogTitle>

                                      <AlertDialogDescription>
                                        {common(
                                          "confirm_action_description",
                                        )}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        {common(
                                          "cancel",
                                        )}
                                      </AlertDialogCancel>

                                      <AlertDialogAction
                                        disabled={
                                          isPending
                                        }
                                        onClick={() =>
                                          execute(
                                            () =>
                                              closeGovernanceResolution(
                                                resolution.public_id,
                                              ),
                                            common(
                                              "resolution_closed",
                                            ),
                                            id,
                                          )
                                        }
                                      >
                                        {common(
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

      {voteDialogResolution && (
        <AlertDialog
          open={
            voteDialogResolution
            !== null
          }
          onOpenChange={(open) => {
            if (! open) {
              setVoteDialogResolution(
                null,
              );
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {common(
                  "cast_vote",
                )}
              </AlertDialogTitle>

              <AlertDialogDescription>
                {common(
                  "vote_description",
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
                  ] as VoteChoice[]
                ).map(
                  (choice) => (
                    <Button
                      key={choice}
                      type="button"
                      variant={
                        voteChoice
                        === choice
                          ? "default"
                          : "outline"
                      }
                      disabled={
                        conflictDeclared
                        && choice
                          === "APPROVE"
                      }
                      onClick={() =>
                        setVoteChoice(
                          choice,
                        )
                      }
                    >
                      {common(
                        `vote_${choice.toLowerCase()}`,
                      )}
                    </Button>
                  ),
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {common(
                    "vote_reason",
                  )}
                </label>

                <Textarea
                  value={voteReason}
                  maxLength={5000}
                  onChange={(event) =>
                    setVoteReason(
                      event.target.value,
                    )
                  }
                  placeholder={
                    common(
                      "vote_reason_placeholder",
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
                      event.target.checked;

                    setConflictDeclared(
                      checked,
                    );

                    if (
                      checked
                      && voteChoice
                        === "APPROVE"
                    ) {
                      setVoteChoice(
                        "RECUSE",
                      );
                    }
                  }}
                  className="mt-1 size-4"
                />

                <span className="space-y-1">
                  <span className="block text-sm font-medium">
                    {common(
                      "declare_conflict",
                    )}
                  </span>

                  <span className="block text-xs text-muted-foreground">
                    {common(
                      "declare_conflict_description",
                    )}
                  </span>
                </span>
              </label>

              {conflictDeclared && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {common(
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
                      common(
                        "conflict_notes_placeholder",
                      )
                    }
                  />
                </div>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>
                {common(
                  "cancel",
                )}
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={
                  isPending
                  || (
                    conflictDeclared
                    && voteChoice
                      === "APPROVE"
                  )
                }
                onClick={() => {
                  const meeting =
                    meetings.find(
                      (item) =>
                        (
                          resolutionsByMeeting[
                            item.public_id
                          ]
                          ?? []
                        ).some(
                          (resolution) =>
                            resolution.public_id
                            === voteDialogResolution
                              .public_id,
                        ),
                    );

                  if (! meeting) {
                    toast.error(
                      common(
                        "failed",
                      ),
                    );

                    return;
                  }

                  submitVote(
                    meeting.public_id,
                  );
                }}
              >
                {common(
                  "submit_vote",
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
