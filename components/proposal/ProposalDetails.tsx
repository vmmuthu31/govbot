"use client";

import { useState } from "react";
import { ExternalLinkIcon, Bot, User, ChevronDown, Wallet } from "lucide-react";
import { Badge } from "../ui/badge";
import { ProposalWithMessages } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { VoteSummary } from "./VoteSummary";
import { formatDistanceToNow } from "@/utils/formatDistanceToNow";
import { MarkdownViewer } from "../Markdown/MarkdownViewer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Separator } from "@/components/ui/separator";
import styles from "./ProposalDetails.module.css";
import { FiClock } from "react-icons/fi";
import { WalletNudgeDialog } from "../wallet/WalletNudgeDialog";

interface ProposalDetailsProps {
  proposal: ProposalWithMessages;
}

export function ProposalDetails({ proposal }: ProposalDetailsProps) {
  const [activeTab, setActiveTab] = useState("details");
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
            <Badge variant="outline">
              Track No: {proposal.track || "Unknown Track"}
            </Badge>
            <Badge variant="secondary">Proposal ID: {proposal.chainId}</Badge>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
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

      <Tabs
        defaultValue="details"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="chat">Chat History</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          {/* AI Summary Collapsible */}
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
                <MarkdownViewer markdown="This proposal seeks funding for the development and open-source release of Epico, an Ethereum wallet compatibility layer for Polkadot SDK chains. Epico enables users to interact with Polkadot-based applications using familiar Ethereum wallets like MetaMask, without requiring EVM emulation or wallet plugins. The project aims to reduce barriers to adoption by allowing seamless wallet integration across ecosystems." />
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Full Proposal Content */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">
              📄 Proposal Description
            </h4>
            <div className="rounded-md border bg-muted/30 p-4 max-h-[400px] overflow-y-auto">
              <div className="overflow-x-auto">
                <MarkdownViewer
                  truncate={false}
                  markdown={proposal.description}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="chat" className="mt-4">
          <div className="space-y-4 rounded-md border bg-muted/30 p-4 max-h-[400px] overflow-y-auto">
            {proposal?.messages?.length > 0 ? (
              proposal?.messages?.map((message, index) => (
                <div key={index} className="border-b pb-3 last:border-0">
                  <div className="mb-1 flex items-center gap-2">
                    {message.role === "user" ? (
                      <>
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Proposer</span>
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">GovBot</span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(message.createdAt)}
                    </span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert">
                    <MarkdownViewer markdown={message.content} />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
                <Bot className="mb-2 h-8 w-8 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-muted-foreground">No chat history yet.</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                    <span>
                      Connect your wallet to start chatting with GovBot
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setWalletNudgeOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 dark:from-purple-950 dark:to-pink-950 border border-purple-200 dark:border-purple-800 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
                >
                  🚀 Connect Wallet & Start Chatting
                </button>
                <p className="text-xs text-muted-foreground max-w-md">
                  Only the proposer can chat with this proposal. Connect your
                  wallet to verify your identity and start the conversation.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
