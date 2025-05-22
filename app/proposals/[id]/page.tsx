"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProposalDetails } from "@/components/proposal/ProposalDetails";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { OnChainInfo } from "@/components/proposal/OnChainInfo";
import { ProposalWithMessages, ChatMessage } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ProposalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProposalDetailPage({
  params,
}: ProposalDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [proposal, setProposal] = useState<ProposalWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await fetch(`/api/proposals/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch proposal");
        }

        const data = await response.json();
        setProposal(data.proposal);
      } catch (err) {
        console.error("Error fetching proposal:", err);
        setError("Failed to load the proposal. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [id]);

  const handleRequestVote = async () => {
    if (!proposal) return;

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposalId: proposal.chainId,
          conviction: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to request vote");
      }

      const data = await response.json();

      if (data.onChain) {
        toast.success(
          `GovBot has voted ${data.vote.decision} on this proposal and submitted the decision on-chain`
        );
      } else {
        toast.success(
          `GovBot has voted ${data.vote.decision} on this proposal`
        );
      }
      setProposal((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          vote: data.vote,
        };
      });

      router.refresh();
    } catch (error) {
      console.error("Error requesting vote:", error);
      toast.error("Failed to request vote. Please try again.");
    }
  };

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
              <h1 className="mb-2 text-xl font-medium">Error</h1>
              <p className="text-muted-foreground">
                {error ||
                  "Proposal not found. Please check the URL and try again."}
              </p>
            </div>
          </div>
        </div>
      </RootLayout>
    );
  }

  const messages: ChatMessage[] = proposal?.messages?.map((message) => ({
    id: message.id,
    content: message.content,
    role: message.role as "user" | "assistant",
    createdAt: message.createdAt,
  }));

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
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-3">
              <ProposalDetails proposal={proposal} />
            </div>
            <div className="md:col-span-2 space-y-8">
              <ChatInterface
                proposal={proposal}
                initialMessages={messages}
                onRequestVote={handleRequestVote}
              />
              <OnChainInfo chainId={proposal.chainId} />
            </div>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
