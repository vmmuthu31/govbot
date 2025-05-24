"use client";

import { useState, useEffect } from "react";
import { RefCountedProposal } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Users, Info } from "lucide-react";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import Link from "next/link";

interface OnChainInfoProps {
  proposal?: RefCountedProposal | null;
}

export function OnChainInfo({ proposal }: OnChainInfoProps) {
  const [loading, setLoading] = useState(!!!proposal);
  const [error, setError] = useState<string | null>(null);
  const [votingPower, setVotingPower] = useState<string | null>(null);
  const [botAddress, setBotAddress] = useState<string | null>(null);

  useEffect(() => {
    const fetchOnChainData = async () => {
      try {
        const vpResponse = await fetch("/api/polkadot/voting-power");
        if (vpResponse.ok) {
          const vpData = await vpResponse.json();
          setVotingPower(vpData.formatted || "0 DOT");
          setBotAddress(vpData.address || null);
        }
      } catch (err) {
        console.error("Error fetching on-chain data:", err);
        setError("Failed to load on-chain data");
      } finally {
        setLoading(false);
      }
    };

    fetchOnChainData();
  }, [proposal]);

  if (loading) {
    return (
      <div className="space-y-4 rounded-md border p-4">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Error loading on-chain data</AlertTitle>
        <AlertDescription>
          {error || "Could not find on-chain proposal data"}
        </AlertDescription>
      </Alert>
    );
  }

  const formatDOT = (value: string) => {
    const amount = parseInt(value) / 10_000_000_000;
    const formatter = new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return `${formatter.format(amount)} DOT`;
  };

  const ayeVotes = formatDOT(proposal.tally.ayes);
  const nayVotes = formatDOT(proposal.tally.nays);

  const totalVotes =
    parseInt(proposal.tally.ayes) + parseInt(proposal.tally.nays);
  const ayePercentage =
    totalVotes === 0
      ? 0
      : Math.round((parseInt(proposal.tally.ayes) / totalVotes) * 100);
  const nayPercentage =
    totalVotes === 0
      ? 0
      : Math.round((parseInt(proposal.tally.nays) / totalVotes) * 100);

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="text-lg font-medium">On-Chain Data</h3>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Referendum ID:</span>
          <span className="font-medium">{proposal.id}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Track:</span>
          <span className="font-medium">{proposal.track}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Decision Deposit:</span>
          <span className="font-medium">
            {proposal.decisionDepositPlaced ? "Placed" : "Not Placed"}
          </span>
        </div>

        {proposal.decisionDeposit && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Deposit Amount:</span>
            <span className="font-medium">
              {formatDOT(proposal.decisionDeposit.amount)}
            </span>
          </div>
        )}

        {proposal.decisionDeposit && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Depositor:</span>
            <span className="font-mono text-xs">
              {proposal.decisionDeposit.who.slice(0, 8)}...
              {proposal.decisionDeposit.who.slice(-6)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium">Current Votes</h4>

        <div className="h-4 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full bg-green-500"
            style={{ width: `${ayePercentage}%` }}
          />
        </div>

        <div className="flex justify-between text-xs">
          <div>
            <span className="font-medium text-green-600">Aye: {ayeVotes}</span>
            <span className="ml-1 text-muted-foreground">
              ({ayePercentage}%)
            </span>
          </div>
          <div>
            <span className="font-medium text-red-600">Nay: {nayVotes}</span>
            <span className="ml-1 text-muted-foreground">
              ({nayPercentage}%)
            </span>
          </div>
        </div>
      </div>

      {votingPower && (
        <div className="mt-4 rounded-md bg-primary/10 p-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium">GovBot Voting Power:</span>
            <span>{votingPower}</span>
          </div>
          {botAddress && (
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="mr-1">Address:</span>
              <Link
                href={`https://polkadot.subscan.io/account/${botAddress}`}
                target="_blank"
                className="rounded bg-muted px-1 py-0.5"
              >
                {botAddress.slice(0, 8)}...{botAddress.slice(-6)}
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="pt-2">
        <a
          href={`https://polkadot.subscan.io/referenda_v2/${proposal.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="mr-2 h-3 w-3" />
            View on Subscan
          </Button>
        </a>
      </div>
    </div>
  );
}
