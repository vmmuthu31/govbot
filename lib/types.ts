import type { Proposal, Vote, Message } from "@/lib/generated/prisma";

export type ProposalWithMessages = Proposal & {
  messages: Message[];
  vote: Vote | null;
};

export interface PolkassemblyResponse {
  title: string;
  content: string;
  created_at: string;
  proposer: string;
  track?: string;
}

export interface InsertProposal {
  chainId: string;
  title: string;
  description: string;
  proposer: string;
  track?: string;
  createdAt: string;
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

export interface RefCountedProposal {
  id: string;
  track: string;
  submitted: string;
  submitter: string;
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
