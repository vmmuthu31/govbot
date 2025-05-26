"use client";

import { CheckCircle, XCircle, HelpCircle } from "lucide-react";
import type { Vote } from "@/lib/generated/prisma";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { formatDistanceToNow } from "@/utils/formatDistanceToNow";
import { MarkdownViewer } from "../Markdown/MarkdownViewer";

interface VoteSummaryProps {
  vote: Vote;
}

export function VoteSummary({ vote }: VoteSummaryProps) {
  const getVoteIcon = () => {
    switch (vote.decision) {
      case "Aye":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "Nay":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "Abstain":
        return <HelpCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getVoteColor = () => {
    switch (vote.decision) {
      case "Aye":
        return "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950";
      case "Nay":
        return "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950";
      case "Abstain":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950";
      default:
        return "";
    }
  };

  return (
    <Alert className={`mt-4 ${getVoteColor()}`}>
      <div className="flex items-start">
        <div className="mr-2 flex-shrink-0">{getVoteIcon()}</div>
        <div>
          <AlertTitle className="mb-2 flex items-center text-lg font-medium">
            GovBot has voted {vote.decision} on this proposal
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({formatDistanceToNow(vote.votedAt)})
            </span>
          </AlertTitle>
          <AlertDescription className="mt-2">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <MarkdownViewer markdown={vote.reasoning} />
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Voted with {vote.conviction}x conviction.
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
