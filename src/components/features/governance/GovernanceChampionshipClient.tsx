"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  type GovernanceRecord,
  getChampionshipCategories,
  getChampionshipNominations,
  declareChampionshipConflict,
  recuseChampionshipJudge,
  submitChampionshipScore,
  certifyChampionshipCategory,
  certifyChampionshipSeason,
} from "@/actions/workspace/governance.actions";

import { useRouter } from "@/i18n/navigation";
import { useCan } from "@/providers/AbilityProvider";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  seasons: GovernanceRecord[];
};

type RecordMap = Record<
  string,
  GovernanceRecord[]
>;

type Criterion = {
  code: string;
  maximum_score: number;
  name?: string;
  label?: string;
};

type ActiveNomination = {
  category: GovernanceRecord;
  nomination: GovernanceRecord;
} | null;

function label(
  record: GovernanceRecord,
): string {
  const candidates = [
    record.name,
    record.title,
    record.nominee_display_name,
    record.category_code,
    record.season_code,
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

function parseCriteria(
  category: GovernanceRecord,
): Criterion[] {
  const raw =
    category.criteria_definition;

  let value: unknown = raw;

  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (! Array.isArray(value)) {
    return [];
  }

  const result: Criterion[] = [];

  for (const item of value) {
    if (
      typeof item !== "object"
      || item === null
    ) {
      continue;
    }

    const row =
      item as Record<
        string,
        unknown
      >;

    const code =
      typeof row.code === "string"
        ? row.code.trim()
        : "";

    const maximum =
      Number(
        row.maximum_score,
      );

    if (
      code === ""
      || ! Number.isFinite(
        maximum,
      )
      || maximum <= 0
    ) {
      continue;
    }

    result.push({
      code,
      maximum_score:
        maximum,
      name:
        typeof row.name
          === "string"
          ? row.name
          : undefined,
      label:
        typeof row.label
          === "string"
          ? row.label
          : undefined,
    });
  }

  return result;
}

export default function GovernanceChampionshipClient({
  seasons,
}: Props) {
  const t = useTranslations(
    "governance.championship"
  );

  const a = useTranslations(
    "governance.actions"
  );

  const router = useRouter();

  const canJudgeRecuse =
    useCan(
      "workspace.ceo_championship_judging.recuse",
    );

  const canJudgeScore =
    useCan(
      "workspace.ceo_championship_judging.score",
    );

  const canCertify =
    useCan(
      "workspace.ceo_championship.certify",
    );

  const [
    categoriesBySeason,
    setCategoriesBySeason,
  ] = useState<RecordMap>({});

  const [
    nominationsByCategory,
    setNominationsByCategory,
  ] = useState<RecordMap>({});

  const [
    scoreTarget,
    setScoreTarget,
  ] = useState<ActiveNomination>(
    null,
  );

  const [
    conflictTarget,
    setConflictTarget,
  ] = useState<GovernanceRecord | null>(
    null,
  );

  const [
    recuseTarget,
    setRecuseTarget,
  ] = useState<GovernanceRecord | null>(
    null,
  );

  const [
    conflictReason,
    setConflictReason,
  ] = useState("");

  const [
    recuseReason,
    setRecuseReason,
  ] = useState("");

  const [
    judgeNotes,
    setJudgeNotes,
  ] = useState("");

  const [
    scores,
    setScores,
  ] = useState<
    Record<string, string>
  >({});

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const scoreCriteria =
    useMemo(
      () =>
        scoreTarget
          ? parseCriteria(
              scoreTarget.category,
            )
          : [],
      [scoreTarget],
    );

  async function loadCategories(
    seasonPublicId: string,
    force = false,
  ) {
    if (
      ! force
      && categoriesBySeason[
        seasonPublicId
      ]
    ) {
      return;
    }

    const result =
      await getChampionshipCategories(
        seasonPublicId,
      );

    if (! result.success) {
      toast.error(
        result.error
        || a("failed"),
      );

      return;
    }

    setCategoriesBySeason(
      (current) => ({
        ...current,
        [seasonPublicId]:
          result.data ?? [],
      }),
    );
  }

  async function loadNominations(
    categoryPublicId: string,
    force = false,
  ) {
    if (
      ! force
      && nominationsByCategory[
        categoryPublicId
      ]
    ) {
      return;
    }

    const result =
      await getChampionshipNominations(
        categoryPublicId,
      );

    if (! result.success) {
      toast.error(
        result.error
        || a("failed"),
      );

      return;
    }

    setNominationsByCategory(
      (current) => ({
        ...current,
        [categoryPublicId]:
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
    refreshCategory?: string,
  ) {
    startTransition(
      async () => {
        const result =
          await action();

        if (! result.success) {
          toast.error(
            result.error
            || a("failed"),
          );

          return;
        }

        toast.success(
          successMessage,
        );

        if (refreshCategory) {
          await loadNominations(
            refreshCategory,
            true,
          );
        }

        router.refresh();
      },
    );
  }

  function openScore(
    category: GovernanceRecord,
    nomination: GovernanceRecord,
  ) {
    const criteria =
      parseCriteria(category);

    if (criteria.length === 0) {
      toast.error(
        a(
          "championship_missing_criteria",
        ),
      );

      return;
    }

    const initial: Record<
      string,
      string
    > = {};

    for (const criterion of criteria) {
      initial[
        criterion.code
      ] = "";
    }

    setScores(initial);
    setJudgeNotes("");
    setScoreTarget({
      category,
      nomination,
    });
  }

  function submitScore() {
    if (! scoreTarget) {
      return;
    }

    const criteria =
      parseCriteria(
        scoreTarget.category,
      );

    if (criteria.length === 0) {
      toast.error(
        a(
          "championship_missing_criteria",
        ),
      );

      return;
    }

    const payload: Record<
      string,
      number
    > = {};

    let total = 0;

    for (const criterion of criteria) {
      const raw =
        scores[
          criterion.code
        ];

      if (
        raw === undefined
        || raw.trim() === ""
      ) {
        toast.error(
          a(
            "championship_all_scores_required",
          ),
        );

        return;
      }

      const value =
        Number(raw);

      if (
        ! Number.isFinite(value)
        || value < 0
        || value
          > criterion.maximum_score
      ) {
        toast.error(
          a(
            "championship_score_out_of_range",
            {
              code:
                criterion.code,
              max:
                criterion.maximum_score,
            },
          ),
        );

        return;
      }

      payload[
        criterion.code
      ] = value;

      total += value;
    }

    const categoryMaximum =
      Number(
        scoreTarget.category
          .maximum_score,
      );

    if (
      Number.isFinite(
        categoryMaximum,
      )
      && categoryMaximum > 0
      && total > categoryMaximum
    ) {
      toast.error(
        a(
          "championship_total_exceeds_maximum",
          {
            max:
              categoryMaximum,
          },
        ),
      );

      return;
    }

    const categoryId =
      scoreTarget
        .category
        .public_id;

    const nominationId =
      scoreTarget
        .nomination
        .public_id;

    run(
      () =>
        submitChampionshipScore(
          nominationId,
          {
            criteria_scores:
              payload,
            judge_notes:
              judgeNotes.trim()
              || null,
          },
        ),
      a(
        "championship_score_submitted",
      ),
      categoryId,
    );

    setScoreTarget(null);
    setScores({});
    setJudgeNotes("");
  }

  return (
    <div className="space-y-4">
      {seasons.length === 0 && (
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
      )}

      {seasons.map(
        (season) => {
          const seasonId =
            season.public_id;

          const categories =
            categoriesBySeason[
              seasonId
            ];

          return (
            <Card key={seasonId}>
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle>
                      {label(season)}
                    </CardTitle>

                    <CardDescription className="mt-1">
                      {seasonId}
                    </CardDescription>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {season.status && (
                      <Badge variant="outline">
                        {String(
                          season.status,
                        )}
                      </Badge>
                    )}

                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        isPending
                      }
                      onClick={() =>
                        void loadCategories(
                          seasonId,
                        )
                      }
                    >
                      {a(
                        "championship_view_categories",
                      )}
                    </Button>

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
                            "championship_certify_season",
                          )}
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {a(
                                "championship_confirm_certify_season",
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
                                    certifyChampionshipSeason(
                                      seasonId,
                                    ),
                                  a(
                                    "championship_season_certified",
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

              {categories && (
                <CardContent className="space-y-3">
                  {categories.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      {t(
                        "no_categories",
                      )}
                    </div>
                  ) : (
                    categories.map(
                      (category) => {
                        const categoryId =
                          category.public_id;

                        const nominations =
                          nominationsByCategory[
                            categoryId
                          ];

                        return (
                          <div
                            key={
                              categoryId
                            }
                            className="rounded-lg border p-4"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <p className="font-medium">
                                  {label(
                                    category,
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                  {categoryId}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={
                                    isPending
                                  }
                                  onClick={() =>
                                    void loadNominations(
                                      categoryId,
                                    )
                                  }
                                >
                                  {a(
                                    "championship_view_nominations",
                                  )}
                                </Button>

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
                                        "championship_certify_category",
                                      )}
                                    </AlertDialogTrigger>

                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          {a(
                                            "championship_confirm_certify_category",
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
                                                certifyChampionshipCategory(
                                                  categoryId,
                                                ),
                                              a(
                                                "championship_category_certified",
                                              ),
                                              categoryId,
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

                            {nominations && (
                              <div className="mt-4 space-y-3">
                                {nominations.length === 0 ? (
                                  <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
                                    {t(
                                      "no_nominations",
                                    )}
                                  </div>
                                ) : (
                                  nominations.map(
                                    (nomination) => (
                                      <div
                                        key={
                                          nomination.public_id
                                        }
                                        className="flex flex-col gap-3 rounded-lg border p-3 xl:flex-row xl:items-center xl:justify-between"
                                      >
                                        <div>
                                          <p className="font-medium">
                                            {label(
                                              nomination,
                                            )}
                                          </p>

                                          <p className="mt-1 text-xs text-muted-foreground">
                                            {
                                              nomination.public_id
                                            }
                                          </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                          {nomination.status && (
                                            <Badge variant="outline">
                                              {String(
                                                nomination.status,
                                              )}
                                            </Badge>
                                          )}

                                          {canJudgeRecuse && (
                                            <>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={
                                                  isPending
                                                }
                                                onClick={() => {
                                                  setConflictReason(
                                                    "",
                                                  );

                                                  setConflictTarget(
                                                    nomination,
                                                  );
                                                }}
                                              >
                                                {a(
                                                  "championship_declare_conflict",
                                                )}
                                              </Button>

                                              <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={
                                                  isPending
                                                }
                                                onClick={() => {
                                                  setRecuseReason(
                                                    "",
                                                  );

                                                  setRecuseTarget(
                                                    nomination,
                                                  );
                                                }}
                                              >
                                                {a(
                                                  "championship_recuse",
                                                )}
                                              </Button>
                                            </>
                                          )}

                                          {canJudgeScore && (
                                            <Button
                                              size="sm"
                                              disabled={
                                                isPending
                                              }
                                              onClick={() =>
                                                openScore(
                                                  category,
                                                  nomination,
                                                )
                                              }
                                            >
                                              {a(
                                                "championship_score",
                                              )}
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ),
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        );
                      },
                    )
                  )}
                </CardContent>
              )}
            </Card>
          );
        },
      )}

      {conflictTarget && (
        <AlertDialog
          open={
            conflictTarget !== null
          }
          onOpenChange={(open) => {
            if (! open) {
              setConflictTarget(
                null,
              );
              setConflictReason("");
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {a(
                  "championship_declare_conflict",
                )}
              </AlertDialogTitle>

              <AlertDialogDescription>
                {a(
                  "championship_conflict_description",
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Textarea
              value={conflictReason}
              maxLength={10000}
              onChange={(event) =>
                setConflictReason(
                  event.target.value,
                )
              }
              placeholder={
                a(
                  "championship_conflict_reason",
                )
              }
            />

            <AlertDialogFooter>
              <AlertDialogCancel>
                {a("cancel")}
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={
                  isPending
                  || conflictReason
                    .trim() === ""
                }
                onClick={() => {
                  const target =
                    conflictTarget;

                  run(
                    () =>
                      declareChampionshipConflict(
                        target.public_id,
                        conflictReason.trim(),
                      ),
                    a(
                      "championship_conflict_recorded",
                    ),
                  );

                  setConflictTarget(
                    null,
                  );
                  setConflictReason("");
                }}
              >
                {a("confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {recuseTarget && (
        <AlertDialog
          open={
            recuseTarget !== null
          }
          onOpenChange={(open) => {
            if (! open) {
              setRecuseTarget(null);
              setRecuseReason("");
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {a(
                  "championship_recuse",
                )}
              </AlertDialogTitle>

              <AlertDialogDescription>
                {a(
                  "championship_recuse_description",
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Textarea
              value={recuseReason}
              maxLength={10000}
              onChange={(event) =>
                setRecuseReason(
                  event.target.value,
                )
              }
              placeholder={
                a(
                  "championship_recuse_reason",
                )
              }
            />

            <AlertDialogFooter>
              <AlertDialogCancel>
                {a("cancel")}
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={isPending}
                onClick={() => {
                  const target =
                    recuseTarget;

                  run(
                    () =>
                      recuseChampionshipJudge(
                        target.public_id,
                        recuseReason.trim()
                        || null,
                      ),
                    a(
                      "championship_recused",
                    ),
                  );

                  setRecuseTarget(
                    null,
                  );
                  setRecuseReason("");
                }}
              >
                {a("confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {scoreTarget && (
        <AlertDialog
          open={
            scoreTarget !== null
          }
          onOpenChange={(open) => {
            if (! open) {
              setScoreTarget(null);
              setScores({});
              setJudgeNotes("");
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {a(
                  "championship_score_nomination",
                )}
              </AlertDialogTitle>

              <AlertDialogDescription>
                {a(
                  "championship_score_description",
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="max-h-[55vh] space-y-4 overflow-y-auto">
              {scoreCriteria.map(
                (criterion) => (
                  <div
                    key={
                      criterion.code
                    }
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium">
                      {
                        criterion.label
                        || criterion.name
                        || criterion.code
                      }
                    </label>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={
                          criterion.maximum_score
                        }
                        step="0.01"
                        value={
                          scores[
                            criterion.code
                          ] ?? ""
                        }
                        onChange={(event) =>
                          setScores(
                            (current) => ({
                              ...current,
                              [
                                criterion.code
                              ]:
                                event.target.value,
                            }),
                          )
                        }
                      />

                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        / {
                          criterion.maximum_score
                        }
                      </span>
                    </div>
                  </div>
                ),
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {a(
                    "championship_judge_notes",
                  )}
                </label>

                <Textarea
                  value={judgeNotes}
                  maxLength={10000}
                  onChange={(event) =>
                    setJudgeNotes(
                      event.target.value,
                    )
                  }
                  placeholder={
                    a(
                      "championship_judge_notes_placeholder",
                    )
                  }
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>
                {a("cancel")}
              </AlertDialogCancel>

              <AlertDialogAction
                disabled={
                  isPending
                  || scoreCriteria
                    .length === 0
                }
                onClick={
                  submitScore
                }
              >
                {a(
                  "championship_submit_score",
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
