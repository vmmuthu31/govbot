"use client";

import { useState } from "react";
import { ExternalLinkIcon, User, ChevronDown } from "lucide-react";
import { Badge } from "../ui/badge";
import { ENetwork, ProposalWithMessages } from "@/lib/types";
import { VoteSummary } from "./VoteSummary";
import { formatDistanceToNow } from "@/utils/formatDistanceToNow";
import { MarkdownViewer } from "../Markdown/MarkdownViewer";
import { getTrackName } from "@/utils/getTrackName";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Separator } from "@/components/ui/separator";
import styles from "./ProposalDetails.module.css";
import { FiClock } from "react-icons/fi";
import { WalletNudgeDialog } from "../wallet/WalletNudgeDialog";
import { useNetwork } from "@/lib/network-context";

interface ProposalDetailsProps {
  proposal: ProposalWithMessages;
}

export function ProposalDetails({ proposal }: ProposalDetailsProps) {
  const { networkConfig } = useNetwork();
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [walletNudgeOpen, setWalletNudgeOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<{
    address: string;
    name?: string;
    source: string;
    type?: string;
    genesisHash?: string;
  } | null>(null);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              #{" "}
              {networkConfig.id == ENetwork.POLKADOT
                ? proposal.id
                : proposal.chainId}
            </Badge>
            <Badge variant="outline">
              {getTrackName(proposal.track || "Unknown Track")}
            </Badge>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <FiClock className="mr-1 h-4 w-4" />
            <span>{formatDistanceToNow(proposal.createdAt)}</span>
          </div>
        </div>
        <h1 className="text-xl font-bold">{proposal.title}</h1>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>
            Proposer: {proposal.proposer.slice(0, 6)}...
            {proposal.proposer.slice(-6)}
          </span>
        </div>
        <div className="flex gap-2">
          <a
            href={`https://${proposal.network}.polkassembly.io/referenda/${proposal.chainId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-primary underline-offset-4 hover:underline"
          >
            View on Polkassembly <ExternalLinkIcon className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>

      {proposal.vote && <VoteSummary vote={proposal.vote} />}

      <div className="w-full">
        <div>
          {proposal.contentSummary && (
            <Collapsible
              open={isCollapsibleOpen}
              onOpenChange={setIsCollapsibleOpen}
              className={
                styles.collapsibleWrapper ||
                "relative w-full rounded-xl p-px bg-gradient-to-r from-pink-500 via-blue-400 to-purple-600 overflow-hidden mb-5"
              }
            >
              <div
                className={`${
                  styles.collapsibleInner ||
                  "rounded-[11px] w-full transition-all duration-300"
                } ${
                  styles.postContentGradient ||
                  "bg-gradient-to-b from-purple-50 to-gray-50"
                }`}
              >
                <CollapsibleTrigger
                  className={
                    styles.collapsibleTrigger ||
                    "flex w-full items-center justify-between p-2 font-medium text-foreground bg-transparent border-none cursor-pointer hover:opacity-80"
                  }
                >
                  <span>✨ AI Summary</span>
                  <ChevronDown
                    className={`${
                      styles.chevronIcon ||
                      "w-4 h-4 text-foreground font-semibold transition-transform duration-300"
                    } ${isCollapsibleOpen ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent
                  className={styles.collapsibleContent || "px-6 pb-6 text-sm"}
                >
                  <Separator className="mb-3 mt-0 p-0" />
                  <MarkdownViewer markdown={proposal.contentSummary || ""} />
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Full Proposal Content */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">
              📄 Proposal Description
            </h4>
            <div className="rounded-md border bg-muted/30 p-4  overflow-y-auto">
              <div className="overflow-x-auto">
                <MarkdownViewer
                  truncate={true}
                  className="line-clamp-3"
                  markdown={proposal.description}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Nudge Dialog */}
      <WalletNudgeDialog
        open={walletNudgeOpen}
        onOpenChange={setWalletNudgeOpen}
        onAccountSelected={setSelectedAccount}
        selectedAccount={selectedAccount}
        title="🎯 Ready to Discuss This Proposal?"
        description="Connect your wallet to verify you're the proposer and start an engaging conversation with GovBot about your proposal!"
      />
    </div>
  );
}
