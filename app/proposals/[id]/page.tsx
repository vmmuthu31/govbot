"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProposalDetails } from "@/components/proposal/ProposalDetails";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { OnChainInfo } from "@/components/proposal/OnChainInfo";
import {
  ProposalWithMessages,
  ChatMessage,
  RefCountedProposal,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { NetworkId } from "@/lib/constants";

interface ProposalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProposalDetailPage({
  params,
}: ProposalDetailPageProps) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const network = (searchParams.get("network") || "polkadot") as NetworkId;
  const [proposal, setProposal] = useState<ProposalWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await fetch(`/api/proposals/${id}?network=${network}`);
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 404 && data.status === "inactive") {
            setError(data.error);
            setErrorStatus("inactive");
          } else {
            throw new Error(data.error || "Failed to fetch proposal");
          }
          return;
        }

        const data = await response.json();
        setProposal(data.proposal);
      } catch (err) {
        console.error("Error fetching proposal:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load the proposal. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [id, network]);

  if (loading) {
    return (
      <RootLayout>
        <div className="container py-8">
          <div className="mx-auto max-w-6xl space-y-8">
            <Link
              href="/"
              className="flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to proposals
            </Link>
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </RootLayout>
    );
  }

  if (error || !proposal) {
    return (
      <RootLayout>
        <div className="container py-8">
          <div className="mx-auto max-w-6xl">
            <Link
              href="/"
              className="flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to proposals
            </Link>
            <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
              <h1 className="mb-2 text-xl font-medium text-destructive">
                {errorStatus === "inactive" ? "Inactive Proposal" : "Error"}
              </h1>
              <p className="text-muted-foreground">
                {error ||
                  "Proposal not found. Please check the URL and try again."}
              </p>
              {errorStatus === "inactive" && (
                <p className="mt-4 text-sm text-muted-foreground">
                  This proposal is no longer active. You can view it on{" "}
                  <a
                    href={`https://${network}.polkassembly.io/referenda/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Polkassembly
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        </div>
      </RootLayout>
    );
  }

  const messages: ChatMessage[] =
    proposal?.messages?.map((message) => ({
      id: message.id,
      content: message.content,
      role: message.role as "user" | "assistant",
      createdAt: message.createdAt,
    })) || [];

  return (
    <RootLayout>
      <div className="container py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <Link
            href="/"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to proposals
          </Link>
          <div className="grid gap-6 lg:gap-8 lg:grid-cols-3 grid-cols-1">
            <div className="lg:col-span-2 col-span-1 order-1">
              <div className="space-y-6">
                <div className="text-center lg:text-left">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    📋 Proposal Details
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Overview and on-chain information
                  </p>
                </div>
                <div className="rounded-lg border bg-card shadow-sm">
                  <div className="p-4 space-y-6">
                    <ProposalDetails proposal={proposal} />
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-1 col-span-1 order-2 space-y-6">
              {/*  */}
              <div className="space-y-4">
                <div className="text-center lg:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                    💬 Chat with GovBot
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Discuss this proposal with our AI governance assistant
                  </p>
                </div>
                <div className="sticky top-4">
                  <ChatInterface
                    proposal={proposal}
                    initialMessages={messages}
                  />
                </div>
              </div>
              <OnChainInfo
                proposal={proposal as unknown as RefCountedProposal}
              />
            </div>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
