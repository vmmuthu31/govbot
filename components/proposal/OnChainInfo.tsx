"use client";

import { useState, useEffect, useCallback } from "react";
import { RefCountedProposal } from "@/lib/types";
import { ExternalLink, Users, Info } from "lucide-react";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import Link from "next/link";
import { useNetwork } from "@/lib/network-context";
import { formatBnBalance } from "@/utils/formatBnBalance";

interface OnChainInfoProps {
  proposal?: RefCountedProposal | null;
}

export function OnChainInfo({ proposal }: OnChainInfoProps) {
  const { networkConfig } = useNetwork();
  const [votingPower, setVotingPower] = useState<string | null>(null);
  const botAddress =
    process.env.POLKADOT_BOT_ADDRESS ||
    "13gwtpPgVAxqBJdCbbKgvXa2sCfAXHEPjiQ8jRi6ekBGY8Fx";
  const getUserBalances = useCallback(async () => {
    try {
      const { polkadotClientService } = await import(
        "@/services/polkadot-client"
      );
      const result = await polkadotClientService?.getUserBalances(
        botAddress || "",
        networkConfig.id
      );
      return result;
    } catch (error) {
      console.error("Error in getUserBalances:", error);
      return null;
    }
  }, [botAddress, networkConfig.id]);

  useEffect(() => {
    const fetchUserBalances = async () => {
      const userBalances = await getUserBalances();
      const balance = formatBnBalance(
        userBalances?.totalBalance?.toString() || "0",
        { numberAfterComma: 2, withUnit: true },
        networkConfig.id
      );

      if (
        userBalances?.totalBalance?.toString() === "0" &&
        userBalances?.freeBalance?.toString() !== "0"
      ) {
        const freeBalanceFormatted = formatBnBalance(
          userBalances?.freeBalance?.toString() || "0",
          { numberAfterComma: 2, withUnit: true },
          networkConfig.id
        );
        setVotingPower(freeBalanceFormatted);
      } else {
        setVotingPower(balance);
      }
    };
    fetchUserBalances();
  }, [getUserBalances]);

  if (!proposal) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Error loading on-chain data</AlertTitle>
        <AlertDescription>
          Could not find on-chain proposal data
        </AlertDescription>
      </Alert>
    );
  }

  const formatCurrency = (value: string) => {
    const amount =
      parseInt(value) / Math.pow(10, networkConfig.currency.decimals);
    const formatter = new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return `${formatter.format(amount)} ${networkConfig.currency.symbol}`;
  };

  const ayeVotes = formatCurrency(proposal?.tally?.ayes || "0");
  const nayVotes = formatCurrency(proposal?.tally?.nays || "0");

  const totalVotes =
    parseInt(proposal?.tally?.ayes || "0") +
    parseInt(proposal?.tally?.nays || "0");
  const ayePercentage =
    totalVotes === 0
      ? 0
      : Math.round((parseInt(proposal.tally.ayes) / totalVotes) * 100);
  const nayPercentage =
    totalVotes === 0
      ? 0
      : Math.round((parseInt(proposal.tally.nays) / totalVotes) * 100);

  return (
    <div className="space-y-4 rounded-md border bg-muted/30 p-4">
      <h3 className="text-lg font-medium">On-Chain Data</h3>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Referendum ID:</span>
          <span className="font-medium">{proposal.chainId}</span>
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
              {formatCurrency(proposal.decisionDeposit.amount)}
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
                href={`${networkConfig.subscanUrl}/account/${botAddress}`}
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
          href={`${networkConfig.subscanUrl}/referenda_v2/${proposal.chainId}`}
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
