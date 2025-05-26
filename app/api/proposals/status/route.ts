import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { polkadotService } from "@/services/polkadot";
import { NetworkId } from "@/lib/constants";
import { Proposal, Vote } from "@/lib/generated/prisma";
import { EProposalStatus } from "@/lib/types";

type ProposalWithVote = Proposal & {
  vote?: Vote | null;
};

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const proposalId = url.searchParams.get("id");
    const chainId = url.searchParams.get("chainId");
    const network = (url.searchParams.get("network") ||
      "polkadot") as NetworkId;

    if (!proposalId && !chainId) {
      return NextResponse.json(
        { error: "Proposal ID or chainId is required" },
        { status: 400 }
      );
    }

    let proposal: ProposalWithVote | null = null;

    if (network === "paseo" && chainId) {
      proposal = await prisma.proposal.findFirst({
        where: { chainId: chainId!, network: network },
      });
    } else if (network === "paseo") {
      proposal = await prisma.proposal.findUnique({
        where: { id: proposalId! },
      });
    } else if (chainId) {
      proposal = await prisma.proposal.findFirst({
        where: { chainId: chainId!, network: network },
        include: { vote: true },
      });
    } else {
      proposal = await prisma.proposal.findUnique({
        where: { id: proposalId! },
        include: { vote: true },
      });
    }

    if (!proposal) {
      if (chainId) {
        polkadotService.setNetwork(network);
        try {
          const isActive = await polkadotService.isProposalActive(chainId);
          return NextResponse.json({
            hasVote: false,
            isActive: isActive,
            vote: null,
          });
        } catch (error) {
          console.error("Error checking on-chain proposal:", error);
          return NextResponse.json(
            { error: "Proposal not found" },
            { status: 404 }
          );
        }
      }
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    const proposalNetwork = proposal.network as NetworkId;

    polkadotService.setNetwork(proposalNetwork);
    if (proposal.network === "paseo") {
      return NextResponse.json({
        hasVote: false,
        isActive: proposal.status === EProposalStatus.Active ? true : false,
        vote: null,
      });
    }
    const isActive = await polkadotService.isProposalActive(
      proposal.chainId,
      proposalNetwork
    );

    return NextResponse.json({
      hasVote: !!proposal?.vote,
      isActive: isActive,
      vote: proposal?.vote,
    });
  } catch (error) {
    console.error("Error checking proposal status:", error);
    return NextResponse.json(
      { error: "Failed to check proposal status" },
      { status: 500 }
    );
  }
}
