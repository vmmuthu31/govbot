import {
  POLKADOT_TRACKS,
  VALID_TRACKS_BY_TYPE,
  SCORING_CRITERIA,
  DECISION_THRESHOLDS,
} from "@/lib/constants";
import {
  ProposalWithMessages,
  TrackValidation,
  CostAnalysis,
  ProposalScore,
  VoteDecision,
  VoteHistoryEntry,
} from "@/lib/types";

/**
 * Validates if a proposal is on the correct track
 */
export function validateProposalTrack(
  proposal: ProposalWithMessages,
  proposalType?: string
): TrackValidation {
  const currentTrack = proposal.track || "Unknown";

  if (!proposalType) {
    return {
      isValid: true,
      expectedTracks: [],
      currentTrack,
    };
  }

  const expectedTracks =
    VALID_TRACKS_BY_TYPE[proposalType as keyof typeof VALID_TRACKS_BY_TYPE] ||
    [];
  const isValid = expectedTracks.includes(currentTrack as never);

  let recommendation;
  if (!isValid && expectedTracks.length > 0) {
    const trackNames = expectedTracks
      .map(
        (track) =>
          POLKADOT_TRACKS[track as keyof typeof POLKADOT_TRACKS]?.name || track
      )
      .join(", ");
    recommendation = `This ${proposalType} proposal should be on one of these tracks: ${trackNames}`;
  }

  return {
    isValid,
    expectedTracks,
    currentTrack,
    recommendation,
  };
}

/**
 * Analyzes the cost implications of a proposal
 */
export function analyzeCost(proposal: ProposalWithMessages): CostAnalysis {
  const description = proposal.description.toLowerCase();
  const title = proposal.title.toLowerCase();

  let estimatedCost: number | undefined;
  let costJustification: string | undefined;

  const costRegex = /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(dot|ksm|usd|dollars?)/gi;
  const matches = [
    ...description.matchAll(costRegex),
    ...title.matchAll(costRegex),
  ];

  if (matches.length > 0) {
    const match = matches[0];
    const amount = parseFloat(match[1].replace(/,/g, ""));
    const currency = match[2].toLowerCase();

    if (currency === "dot") {
      estimatedCost = amount;
    } else if (currency === "usd" || currency.includes("dollar")) {
      estimatedCost = amount / 7; // Approximate DOT value
    }

    costJustification = `Estimated cost: ${match[0]}`;
  }

  if (!estimatedCost && proposal.description.includes("beneficiaries")) {
    try {
      const beneficiaryMatch = proposal.description.match(/amount":"(\d+)"/);
      if (beneficiaryMatch && beneficiaryMatch[1]) {
        estimatedCost = parseInt(beneficiaryMatch[1]) / Math.pow(10, 10); // Convert planck to DOT
        costJustification = `Estimated cost from beneficiary data: ${estimatedCost} DOT`;
      }
    } catch (e) {
      console.warn("Failed to parse beneficiary amount:", e);
    }
  }

  let costEffectiveness = 0.5;

  if (proposal.track) {
    const track =
      POLKADOT_TRACKS[proposal.track as keyof typeof POLKADOT_TRACKS];
    if (track) {
      if (
        track.name.includes("Spender") ||
        track.name.includes("Tipper") ||
        track.name.includes("Treasurer")
      ) {
        costEffectiveness = estimatedCost ? 0.7 : 0.3;
        if (
          description.includes("budget") ||
          description.includes("milestone") ||
          description.includes("deliverable")
        ) {
          costEffectiveness += 0.2;
        }
        if (
          description.includes("institutional") ||
          description.includes("adoption") ||
          description.includes("compliance")
        ) {
          costEffectiveness += 0.1;
        }
      }
    }
  }

  costEffectiveness = Math.min(1, costEffectiveness);

  return {
    estimatedCost,
    costJustification,
    costEffectiveness,
    budgetImpact: estimatedCost
      ? estimatedCost > 1000
        ? "High"
        : estimatedCost > 100
        ? "Medium"
        : "Low"
      : undefined,
  };
}

/**
 * Scores a proposal based on various criteria
 */
export function scoreProposal(
  proposal: ProposalWithMessages,
  trackValidation: TrackValidation,
  costAnalysis: CostAnalysis,
  voteHistory: VoteHistoryEntry[]
): ProposalScore {
  const technicalKeywords = [
    "implementation",
    "code",
    "technical",
    "development",
    "upgrade",
    "runtime",
  ];
  const hasTechnicalContent = technicalKeywords.some(
    (keyword) =>
      proposal.description.toLowerCase().includes(keyword) ||
      proposal.title.toLowerCase().includes(keyword)
  );
  const technicalFeasibility = hasTechnicalContent ? 0.8 : 0.6;

  const alignmentKeywords = [
    "ecosystem",
    "community",
    "decentralization",
    "security",
    "scalability",
    "interoperability",
  ];
  const alignmentScore =
    alignmentKeywords.filter(
      (keyword) =>
        proposal.description.toLowerCase().includes(keyword) ||
        proposal.title.toLowerCase().includes(keyword)
    ).length / alignmentKeywords.length;
  const alignmentWithGoals = Math.min(1, alignmentScore + 0.3);

  const economicImplications = costAnalysis.costEffectiveness;

  const securityKeywords = [
    "security",
    "audit",
    "vulnerability",
    "risk",
    "safe",
  ];
  const hasSecurityContent = securityKeywords.some((keyword) =>
    proposal.description.toLowerCase().includes(keyword)
  );
  const securityImplications = hasSecurityContent ? 0.8 : 0.5;

  const messageCount = proposal.messages.length;
  let communitySentiment = Math.min(1, messageCount / 10 + 0.4);

  if (voteHistory.length > 0) {
    const recentVotes = voteHistory.slice(-3);
    const recentAvgScore =
      recentVotes.reduce((sum, v) => sum + v.score, 0) / recentVotes.length;
    if (recentAvgScore > 0.8) {
      communitySentiment *= 0.9;
    } else if (recentAvgScore < 0.4) {
      communitySentiment *= 1.1;
    }
  }
  const trackSpecific = trackValidation.isValid ? 0.9 : 0.3;

  const overall =
    technicalFeasibility * SCORING_CRITERIA.TECHNICAL_FEASIBILITY +
    alignmentWithGoals * SCORING_CRITERIA.ALIGNMENT_WITH_GOALS +
    economicImplications * SCORING_CRITERIA.ECONOMIC_IMPLICATIONS +
    securityImplications * SCORING_CRITERIA.SECURITY_IMPLICATIONS +
    communitySentiment * SCORING_CRITERIA.COMMUNITY_SENTIMENT +
    trackSpecific * SCORING_CRITERIA.TRACK_SPECIFIC;

  return {
    technicalFeasibility,
    alignmentWithGoals,
    economicImplications,
    securityImplications,
    communitySentiment,
    trackSpecific,
    overall,
  };
}

/**
 * Determines vote decision based on score
 */
export function determineVoteDecision(score: ProposalScore): VoteDecision {
  if (score.overall >= DECISION_THRESHOLDS.AYE) {
    return "Aye";
  } else if (score.overall >= DECISION_THRESHOLDS.ABSTAIN) {
    return "Abstain";
  } else {
    return "Nay";
  }
}

/**
 * Generates reasoning based on score breakdown
 */
export function generateScoreBasedReasoning(
  score: ProposalScore,
  trackValidation: TrackValidation,
  costAnalysis: CostAnalysis,
  decision: VoteDecision
): string {
  const reasons: string[] = [];

  if (!trackValidation.isValid && trackValidation.recommendation) {
    reasons.push(`⚠️ Track Concern: ${trackValidation.recommendation}`);
  }

  if (costAnalysis.estimatedCost) {
    reasons.push(
      `💰 Cost Analysis: ${
        costAnalysis.costJustification
      } (Effectiveness: ${Math.round(costAnalysis.costEffectiveness * 100)}%)`
    );
  }

  const scoreBreakdown = [
    `Technical Feasibility: ${Math.round(score.technicalFeasibility * 100)}%`,
    `Alignment with Goals: ${Math.round(score.alignmentWithGoals * 100)}%`,
    `Economic Impact: ${Math.round(score.economicImplications * 100)}%`,
    `Security Considerations: ${Math.round(score.securityImplications * 100)}%`,
    `Community Engagement: ${Math.round(score.communitySentiment * 100)}%`,
    `Track Appropriateness: ${Math.round(score.trackSpecific * 100)}%`,
  ];

  reasons.push(`📊 Score Breakdown:\n${scoreBreakdown.join("\n")}`);
  reasons.push(`🎯 Overall Score: ${Math.round(score.overall * 100)}%`);

  let decisionExplanation = "";
  if (decision === "Aye") {
    decisionExplanation =
      "✅ Voting AYE: This proposal meets the high standards required (≥80% score) and demonstrates strong alignment with Polkadot's goals.";
  } else if (decision === "Abstain") {
    decisionExplanation =
      "⚖️ Abstaining: This proposal shows promise but has areas for improvement (50-79% score). I encourage further discussion and refinement.";
  } else {
    decisionExplanation =
      "❌ Voting NAY: This proposal has significant concerns (<50% score) that need to be addressed before it can be supported.";
  }

  reasons.push(decisionExplanation);

  return reasons.join("\n\n");
}

/**
 * Analyzes vote history to provide insights
 */
export function analyzeVoteHistory(voteHistory: VoteHistoryEntry[]): string {
  if (voteHistory.length === 0) {
    return "This is my first vote! I'm excited to participate in Polkadot governance.";
  }

  const totalVotes = voteHistory.length;
  const ayeVotes = voteHistory.filter((v) => v.decision === "Aye").length;
  const nayVotes = voteHistory.filter((v) => v.decision === "Nay").length;
  const abstainVotes = voteHistory.filter(
    (v) => v.decision === "Abstain"
  ).length;

  const avgScore =
    voteHistory.reduce((sum, v) => sum + v.score, 0) / totalVotes;

  const recentVotes = voteHistory.slice(-5);
  const recentAvgScore =
    recentVotes.reduce((sum, v) => sum + v.score, 0) / recentVotes.length;

  return `📈 My Voting History (${totalVotes} votes):
• Aye: ${ayeVotes} (${Math.round((ayeVotes / totalVotes) * 100)}%)
• Nay: ${nayVotes} (${Math.round((nayVotes / totalVotes) * 100)}%)
• Abstain: ${abstainVotes} (${Math.round((abstainVotes / totalVotes) * 100)}%)
• Average Score: ${Math.round(avgScore * 100)}%
• Recent Performance: ${Math.round(recentAvgScore * 100)}% (last 5 votes)

I strive to maintain high standards while being fair and constructive in my evaluations.`;
}

/**
 * Determines proposal type from content
 */
export function determineProposalType(
  proposal: ProposalWithMessages
): string | undefined {
  const content = (proposal.title + " " + proposal.description).toLowerCase();

  if (
    content.includes("treasury") ||
    content.includes("funding") ||
    content.includes("payment") ||
    content.includes("tip")
  ) {
    return "treasury";
  }
  if (
    content.includes("staking") ||
    content.includes("validator") ||
    content.includes("nomination")
  ) {
    return "staking";
  }
  if (
    content.includes("fellowship") ||
    content.includes("rank") ||
    content.includes("member")
  ) {
    return "fellowship";
  }
  if (
    content.includes("admin") ||
    content.includes("parameter") ||
    content.includes("configuration")
  ) {
    return "admin";
  }
  if (
    content.includes("runtime") ||
    content.includes("upgrade") ||
    content.includes("protocol")
  ) {
    return "root";
  }
  if (content.includes("whitelist") || content.includes("privilege")) {
    return "whitelisted";
  }

  return undefined;
}
