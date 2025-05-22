"use client";

import { useState } from "react";
import { CalendarIcon, ExternalLinkIcon, Bot, User } from "lucide-react";
import { Badge } from "../ui/badge";
import { ProposalWithMessages } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { VoteSummary } from "./VoteSummary";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "@/utils/formatDistanceToNow";

interface ProposalDetailsProps {
  proposal: ProposalWithMessages;
}

export function ProposalDetails({ proposal }: ProposalDetailsProps) {
  const [activeTab, setActiveTab] = useState("details");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Track No: {proposal.track || "Unknown Track"}
            </Badge>
            <Badge variant="secondary">Proposal ID: {proposal.id}</Badge>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="mr-1 h-4 w-4" />
            <span>{formatDistanceToNow(proposal.createdAt)}</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold">{proposal.title}</h1>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Proposer: {proposal.proposer}</span>
        </div>
        <div className="flex gap-2">
          <a
            href={`https://polkadot.polkassembly.io/referenda/${proposal.id}`}
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
          <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-card p-4 shadow-sm">
            <ReactMarkdown>{proposal.description}</ReactMarkdown>
          </div>
        </TabsContent>
        <TabsContent value="chat" className="mt-4">
          <div className="space-y-4 rounded-md border bg-card p-4 shadow-sm">
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
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Bot className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No chat history yet. Start a conversation with GovBot to
                  discuss this proposal.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
