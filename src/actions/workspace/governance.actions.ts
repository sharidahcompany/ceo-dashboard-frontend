"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import type { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export interface GovernanceRecord {
  public_id: string;
  status?: string | null;
  name?: string | null;
  title?: string | null;
  code?: string | null;
  body_code?: string | null;
  election_code?: string | null;
  term_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

interface GovernanceListResponse {
  data: GovernanceRecord[];
}

interface GovernanceItemResponse {
  data: GovernanceRecord;
}

interface GovernanceArrayResponse {
  data: GovernanceRecord[];
}

const BASE = "/workspace/governance";
const PAGE = "/[locale]/governance";

async function getList(
  path: string,
): Promise<ActionResponse<GovernanceRecord[]>> {
  try {
    const response =
      await api.get<GovernanceListResponse>(
        `${BASE}/${path}`,
      );

    return {
      success: true,
      data: response.data.data ?? [],
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

async function postAction(
  path: string,
  payload?: unknown,
): Promise<ActionResponse<GovernanceRecord>> {
  try {
    const response =
      await api.post<GovernanceItemResponse>(
        `${BASE}/${path}`,
        payload,
      );

    revalidatePath(PAGE, "page");

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function getGovernanceBodies() {
  return getList("bodies");
}

export async function getGovernanceMeetings() {
  return getList("meetings");
}

export async function getGovernanceElections() {
  return getList("elections");
}


export async function getGovernanceMeetingResolutions(
  meetingPublicId: string,
): Promise<ActionResponse<GovernanceRecord[]>> {
  return getList(
    `meetings/${encodeURIComponent(meetingPublicId)}/resolutions`,
  );
}

export async function getApprovalCases() {
  return getList("approval-cases");
}


export async function getGovernanceElectionCandidates(
  electionPublicId: string,
): Promise<ActionResponse<GovernanceRecord[]>> {
  return getList(
    `elections/${encodeURIComponent(electionPublicId)}/candidates`,
  );
}


export async function getApprovalCaseSteps(
  casePublicId: string,
): Promise<ActionResponse<GovernanceRecord[]>> {
  return getList(
    `approval-cases/${encodeURIComponent(casePublicId)}/steps`,
  );
}


export async function getGovernanceTransitions(): Promise<
  ActionResponse<GovernanceRecord[]>
> {
  return getList("transitions");
}

export async function getGovernanceTransitionItems(
  transitionPublicId: string,
): Promise<ActionResponse<GovernanceRecord[]>> {
  return getList(
    `transitions/${encodeURIComponent(transitionPublicId)}/items`,
  );
}

export async function getGovernanceTermStatus(
  termPublicId: string,
): Promise<ActionResponse<GovernanceRecord>> {
  try {
    const response =
      await api.get<GovernanceItemResponse>(
        `${BASE}/terms/${encodeURIComponent(termPublicId)}/status`,
      );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function openGovernanceMeeting(
  meetingPublicId: string,
) {
  return postAction(
    `meetings/${encodeURIComponent(meetingPublicId)}/open`,
  );
}

export async function openGovernanceResolution(
  resolutionPublicId: string,
) {
  return postAction(
    `resolutions/${encodeURIComponent(resolutionPublicId)}/open`,
  );
}

export async function closeGovernanceResolution(
  resolutionPublicId: string,
) {
  return postAction(
    `resolutions/${encodeURIComponent(resolutionPublicId)}/close`,
  );
}

export async function voteGovernanceResolution(
  resolutionPublicId: string,
  payload: {
    vote: "APPROVE" | "REJECT" | "ABSTAIN" | "RECUSE";
    reason?: string | null;
    conflict_declared?: boolean;
    conflict_notes?: string | null;
  },
) {
  return postAction(
    `resolutions/${encodeURIComponent(resolutionPublicId)}/vote`,
    payload,
  );
}

export async function publishCandidateProgram(
  candidatePublicId: string,
) {
  return postAction(
    `candidates/${encodeURIComponent(candidatePublicId)}/program/publish`,
  );
}

export async function finalizeGovernanceCandidate(
  candidatePublicId: string,
  eligibilitySnapshot: Record<string, unknown> = {},
) {
  return postAction(
    `candidates/${encodeURIComponent(candidatePublicId)}/finalize`,
    {
      eligibility_snapshot: eligibilitySnapshot,
    },
  );
}

export async function openElectionVoting(
  electionPublicId: string,
) {
  return postAction(
    `elections/${encodeURIComponent(electionPublicId)}/open-voting`,
  );
}

export async function castElectionBallot(
  electionPublicId: string,
  candidatePublicIds: string[],
) {
  return postAction(
    `elections/${encodeURIComponent(electionPublicId)}/ballots`,
    {
      candidate_public_ids: candidatePublicIds,
    },
  );
}

export async function certifyElectionResults(
  electionPublicId: string,
) {
  return postAction(
    `elections/${encodeURIComponent(electionPublicId)}/certify`,
  );
}

export async function decideApprovalCase(
  casePublicId: string,
  stepPublicId: string,
  payload: {
    decision:
      | "APPROVE"
      | "REJECT"
      | "ABSTAIN"
      | "RECUSE"
      | "RETURN_FOR_CHANGES";
    reason?: string | null;
    conflict_declared?: boolean;
    conflict_notes?: string | null;
  },
) {
  return postAction(
    `approval-cases/${encodeURIComponent(casePublicId)}/steps/${encodeURIComponent(stepPublicId)}/decision`,
    payload,
  );
}

export async function updateGovernanceCommitmentProgress(
  itemPublicId: string,
  payload: {
    status: string;
    completion_percentage: number;
    progress_summary?: string | null;
    blocking_reason?: string | null;
    non_completion_reason?: string | null;
    evidence_snapshot?: Record<string, unknown>;
  },
): Promise<ActionResponse<GovernanceRecord>> {
  try {
    const response =
      await api.patch<GovernanceItemResponse>(
        `${BASE}/commitment-items/${encodeURIComponent(itemPublicId)}/progress`,
        payload,
      );

    revalidatePath(PAGE, "page");

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function handoverTransitionItem(
  itemPublicId: string,
  payload: {
    evidence_snapshot?: Record<string, unknown>;
    notes?: string | null;
  },
) {
  return postAction(
    `transition-items/${encodeURIComponent(itemPublicId)}/handover`,
    payload,
  );
}

export async function acceptTransitionItem(
  itemPublicId: string,
  payload: {
    with_reservation?: boolean;
    acceptance_notes?: string | null;
    reservation_notes?: string | null;
  },
) {
  return postAction(
    `transition-items/${encodeURIComponent(itemPublicId)}/accept`,
    payload,
  );
}


export async function getChampionshipSeasons(): Promise<
  ActionResponse<GovernanceRecord[]>
> {
  return getList(
    "championship/seasons",
  );
}

export async function getChampionshipCategories(
  seasonPublicId: string,
): Promise<ActionResponse<GovernanceRecord[]>> {
  return getList(
    `championship/seasons/${encodeURIComponent(seasonPublicId)}/categories`,
  );
}

export async function getChampionshipNominations(
  categoryPublicId: string,
): Promise<ActionResponse<GovernanceRecord[]>> {
  return getList(
    `championship/categories/${encodeURIComponent(categoryPublicId)}/nominations`,
  );
}

export async function submitChampionshipScore(
  nominationPublicId: string,
  payload: {
    criteria_scores: Record<string, number>;
    judge_notes?: string | null;
  },
) {
  return postAction(
    `championship/nominations/${encodeURIComponent(nominationPublicId)}/score`,
    payload,
  );
}

export async function declareChampionshipConflict(
  nominationPublicId: string,
  reason: string,
) {
  return postAction(
    `championship/nominations/${encodeURIComponent(nominationPublicId)}/conflict`,
    { reason },
  );
}

export async function recuseChampionshipJudge(
  nominationPublicId: string,
  reason?: string | null,
) {
  return postAction(
    `championship/nominations/${encodeURIComponent(nominationPublicId)}/recuse`,
    { reason },
  );
}

export async function certifyChampionshipCategory(
  categoryPublicId: string,
): Promise<ActionResponse<GovernanceRecord[]>> {
  try {
    const response =
      await api.post<GovernanceArrayResponse>(
        `${BASE}/championship/categories/${encodeURIComponent(categoryPublicId)}/certify`,
      );

    revalidatePath(PAGE, "page");

    return {
      success: true,
      data: response.data.data ?? [],
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

export async function certifyChampionshipSeason(
  seasonPublicId: string,
) {
  return postAction(
    `championship/seasons/${encodeURIComponent(seasonPublicId)}/certify`,
  );
}
