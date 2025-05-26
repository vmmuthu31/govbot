import type { Proposal, Vote, Message } from "@/lib/generated/prisma";
import type { NetworkId, NetworkConfig } from "./constants";

export enum EProposalStatus {
  DecisionDepositPlaced = "DecisionDepositPlaced",
  Submitted = "Submitted",
  Deciding = "Deciding",
  ConfirmStarted = "ConfirmStarted",
  ConfirmAborted = "ConfirmAborted",
  Approved = "Approved",
  Rejected = "Rejected",
  Cancelled = "Cancelled",
  TimedOut = "TimedOut",
  Killed = "Killed",
  Executed = "Executed",
  Active = "active",
}

export const ACTIVE_PROPOSAL_STATUSES = [
  EProposalStatus.DecisionDepositPlaced,
  EProposalStatus.Submitted,
  EProposalStatus.Deciding,
  EProposalStatus.ConfirmStarted,
  EProposalStatus.ConfirmAborted,
];

export type ProposalWithMessages = Proposal & {
  messages: Message[];
  vote: Vote | null;
};

export interface NetworkContextType {
  selectedNetwork: NetworkId;
  networkConfig: NetworkConfig;
  setSelectedNetwork: (networkId: NetworkId) => void;
}

export interface PolkassemblyResponse {
  title: string;
  content: string;
  created_at: string;
  proposer: string;
  track?: string;
  contentSummary: {
    createdAt: string;
    indexOrHash: string;
    id: string;
    proposalType: string;
    postSummary: string;
  };
}

export interface InsertProposal {
  chainId: string;
  title: string;
  description: string;
  proposer: string;
  track?: string;
  createdAt: string;
  contentSummary: {
    createdAt: string;
    indexOrHash: string;
    id: string;
    proposalType: string;
    postSummary: string;
  };
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id?: string;
  content: string;
  role: ChatRole;
  createdAt?: Date;
}

export type VoteDecision = "Aye" | "Nay" | "Abstain";

export interface VoteRequest {
  proposalId: string;
  decision: VoteDecision;
  reasoning: string;
  conviction?: number;
}

export interface VoteResponse {
  id: string;
  decision: VoteDecision;
  reasoning: string;
  conviction: number;
  votedAt: Date;
  proposalId: string;
}

export interface ProposalScore {
  technicalFeasibility: number;
  alignmentWithGoals: number;
  economicImplications: number;
  securityImplications: number;
  communitySentiment: number;
  trackSpecific: number;
  overall: number;
}

export interface VoteDecisionWithScore {
  decision: VoteDecision;
  reasoning: string;
  score: ProposalScore;
  confidence: number;
}

export interface TrackValidation {
  isValid: boolean;
  expectedTracks: string[];
  currentTrack: string;
  recommendation?: string;
}

export interface CostAnalysis {
  estimatedCost?: number;
  costJustification?: string;
  costEffectiveness: number;
  budgetImpact?: string;
}

export interface VoteHistoryEntry {
  id: string;
  proposalId: string;
  decision: VoteDecision;
  score: number;
  reasoning: string;
  track?: string;
  createdAt: Date;
}

export interface RefCountedProposal {
  id: string;
  track: string;
  chainId?: string;
  submitted: string;
  proposer: string;
  proposal: string;
  decisionDepositPlaced: boolean;
  decisionDeposit?: {
    who: string;
    amount: string;
  };
  tally: {
    ayes: string;
    nays: string;
  };
  title?: string;
  description?: string;
  createdAt?: Date;
  contentSummary?: {
    createdAt: string;
    indexOrHash: string;
    id: string;
    proposalType: string;
    postSummary: string;
  };
}

export interface OnChainVote {
  referendumId: string;
  address: string;
  vote:
    | {
        aye: boolean;
        conviction: number;
      }
    | {
        abstain: boolean;
      };
  timestamp: number;
}

export interface PolkadotAccount {
  address: string;
  name?: string;
  balance?: string;
  votingPower?: string;
}

export interface Post {
  post_id?: string;
  id?: string;
  title?: string;
  description?: string;
  proposer?: string;
  track_name?: string;
  track?: string;
  created_at?: string;
}
