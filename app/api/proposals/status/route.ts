import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { polkadotService } from "@/services/polkadot";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const proposalId = url.searchParams.get("id");

    if (!proposalId) {
      return NextResponse.json(
        { error: "Proposal ID is required" },
        { status: 400 }
      );
    }

    const proposal = await prisma.proposal.findUnique({
      where: { chainId: proposalId },
      include: { vote: true },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    const isActive = await polkadotService.isProposalActive(proposalId);

    return NextResponse.json({
      hasVote: !!proposal.vote,
      isActive: isActive,
      vote: proposal.vote,
    });
  } catch (error) {
    console.error("Error checking proposal status:", error);
    return NextResponse.json(
      { error: "Failed to check proposal status" },
      { status: 500 }
    );
  }
}
