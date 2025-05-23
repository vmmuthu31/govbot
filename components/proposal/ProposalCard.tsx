import type { Proposal, Vote } from "@/lib/generated/prisma";
import Link from "next/link";
import { CalendarIcon, ExternalLinkIcon } from "lucide-react";
import { formatDistanceToNow } from "@/utils/formatDistanceToNow";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import ReactMarkdown from "react-markdown";

interface ProposalCardProps {
  proposal: Proposal & {
    vote: Vote | null;
  };
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const getVoteBadgeColor = (decision: string) => {
    switch (decision) {
      case "Aye":
        return "bg-green-600 hover:bg-green-700";
      case "Nay":
        return "bg-red-600 hover:bg-red-700";
      case "Abstain":
        return "bg-yellow-600 hover:bg-yellow-700";
      default:
        return "bg-primary hover:bg-primary/90";
    }
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Proposal ID: {proposal.chainId || "Unknown Track"}
            </Badge>{" "}
            <Badge variant="outline">
              Track No: {proposal.track || "Unknown Track"}
            </Badge>
            {proposal.vote && (
              <Badge className={getVoteBadgeColor(proposal.vote.decision)}>
                {proposal.vote.decision}
              </Badge>
            )}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <CalendarIcon className="mr-1 h-3 w-3" />
            <span>{formatDistanceToNow(proposal.createdAt)}</span>
          </div>
        </div>
        <CardTitle className="line-clamp-2 text-lg">{proposal.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div
          className="line-clamp-3 text-sm text-muted-foreground"
          style={{ overflow: "hidden" }}
        >
          <ReactMarkdown>
            {proposal.description.replace(/<[^>]*>?/gm, "")}
          </ReactMarkdown>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/10 p-4 mt-auto">
        <div className="flex w-full items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Proposer: {proposal.proposer.slice(0, 6)}...
            {proposal.proposer.slice(-4)}
          </span>
          <div className="flex gap-2">
            <Link
              href={`https://polkadot.polkassembly.io/referenda/${proposal.chainId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-input bg-background px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors hover:bg-muted"
            >
              Polkassembly <ExternalLinkIcon className="ml-1 h-3 w-3" />
            </Link>
            <Link
              href={`/proposals/${proposal.chainId}`}
              className="inline-flex items-center rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              View & Chat
            </Link>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
