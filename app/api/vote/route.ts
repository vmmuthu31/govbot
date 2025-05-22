import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateVoteDecision } from "@/services/ai";
import { polkadotService } from "@/services/polkadot";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { proposalId, conviction = 1 } = await req.json();

    if (!proposalId) {
      return NextResponse.json(
        { error: "Proposal ID is required" },
        { status: 400 }
      );
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        messages: true,
        vote: true,
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    if (proposal.vote) {
      return NextResponse.json({
        vote: proposal.vote,
        message: "This proposal has already been voted on",
      });
    }

    const { decision, reasoning } = await generateVoteDecision(proposal);

    const onChainDecision = decision.toLowerCase() as "aye" | "nay" | "abstain";

    let txHash = "";
    try {
      txHash = await polkadotService.submitVote(
        proposal.chainId,
        onChainDecision,
        conviction
      );
      console.log(`Vote transaction created with hash: ${txHash}`);
    } catch (err) {
      console.error("Failed to submit on-chain vote:", err);
    }

    const vote = await prisma.vote.create({
      data: {
        id: uuidv4(),
        decision,
        reasoning,
        conviction,
        proposalId: proposal.id,
      },
    });

    const decisionMessage = `
I've made my decision on this proposal.

**Decision: ${decision}**

${reasoning}

Thank you for engaging with me on this proposal. My vote has been recorded${
      txHash ? " and submitted to the blockchain" : ""
    }.
`;

    await prisma.message.create({
      data: {
        id: uuidv4(),
        content: decisionMessage,
        role: "assistant",
        proposalId: proposal.id,
      },
    });

    return NextResponse.json({
      vote,
      onChain: txHash
        ? {
            txHash,
            chainId: proposal.chainId,
            decision: onChainDecision,
            conviction,
            status: "submitted",
          }
        : undefined,
    });
  } catch (error) {
    console.error("Error in vote API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
