import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateChatResponse, generateVoteDecision } from "@/services/ai";
import { v4 as uuidv4 } from "uuid";
import { polkadotService } from "@/services/polkadot";

export async function POST(req: NextRequest) {
  try {
    const { proposalId, message } = await req.json();

    if (!proposalId || !message) {
      return NextResponse.json(
        { error: "Proposal ID and message are required" },
        { status: 400 }
      );
    }

    const isActive = await polkadotService.isProposalActive(proposalId);
    if (!isActive) {
      return NextResponse.json(
        {
          error:
            "Cannot chat with inactive proposals. This proposal is no longer active.",
        },
        { status: 400 }
      );
    }

    let proposal = await prisma.proposal.findFirst({
      where: { chainId: proposalId },
      include: {
        messages: true,
        vote: true,
      },
    });

    if (!proposal) {
      const onChainProposal = await polkadotService.fetchProposalById(
        proposalId
      );

      if (!onChainProposal) {
        return NextResponse.json(
          { error: "Proposal not found on-chain" },
          { status: 404 }
        );
      }

      proposal = await prisma.proposal.create({
        data: {
          id: uuidv4(),
          chainId: proposalId,
          title: onChainProposal.title || `Referendum ${proposalId}`,
          description:
            onChainProposal.description || "No description available",
          proposer: onChainProposal.submitter,
          track: onChainProposal.track,
          createdAt: new Date(),
        },
        include: {
          messages: true,
          vote: true,
        },
      });
    }

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    if (proposal.vote) {
      return NextResponse.json(
        {
          error:
            "This proposal has already been voted on. No further chat is possible.",
        },
        { status: 400 }
      );
    }

    const userMessage = await prisma.message.create({
      data: {
        id: uuidv4(),
        content: message,
        role: "user",
        proposalId: proposal.id,
      },
    });

    const messages: {
      id: string;
      content: string;
      role: "user" | "assistant";
      createdAt: Date;
      proposalId: string;
    }[] = [
      ...proposal.messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as "user" | "assistant",
        createdAt: msg.createdAt,
        proposalId: msg.proposalId,
      })),
      {
        id: userMessage.id,
        content: userMessage.content,
        role: userMessage.role as "user" | "assistant",
        createdAt: userMessage.createdAt,
        proposalId: userMessage.proposalId,
      },
    ];

    const responseContent = await generateChatResponse(
      { ...proposal, messages },
      messages
    );

    const assistantMessage = await prisma.message.create({
      data: {
        id: uuidv4(),
        content: responseContent,
        role: "assistant",
        proposalId: proposal.id,
      },
    });

    let vote = null;
    let txHash = null;
    if (!proposal.vote) {
      const { decision, reasoning } = await generateVoteDecision({
        ...proposal,
        messages: [
          ...proposal.messages,
          {
            id: userMessage.id,
            content: userMessage.content,
            role: "user",
            createdAt: userMessage.createdAt,
            proposalId: userMessage.proposalId,
          },
          {
            id: assistantMessage.id,
            content: assistantMessage.content,
            role: "assistant",
            createdAt: assistantMessage.createdAt,
            proposalId: assistantMessage.proposalId,
          },
        ],
      });
      if (decision === "Aye" || decision === "Nay") {
        const testBalance = "100000000";

        const conviction = 1;
        const onChainDecision = decision.toLowerCase() as
          | "aye"
          | "nay"
          | "abstain";
        txHash = await polkadotService.submitVote(
          proposalId,
          onChainDecision,
          conviction,
          testBalance
        );

        vote = await prisma.vote.create({
          data: {
            id: uuidv4(),
            decision,
            reasoning,
            conviction: 1,
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
      }
    }

    return NextResponse.json({
      message: {
        id: assistantMessage.id,
        content: assistantMessage.content,
        role: assistantMessage.role,
        createdAt: assistantMessage.createdAt,
      },
      ...(vote
        ? {
            vote,
            ...(txHash ? { txHash } : {}),
          }
        : {}),
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
