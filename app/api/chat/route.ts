import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { generateChatResponse } from "@/services/ai";

export async function POST(req: NextRequest) {
  try {
    const { proposalId, message } = await req.json();

    if (!proposalId || !message) {
      return NextResponse.json(
        { error: "Proposal ID and message are required" },
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
      const { polkadotService } = await import("@/services/polkadot");
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
        { error: "This proposal has already been voted on" },
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

    return NextResponse.json({
      message: {
        id: assistantMessage.id,
        content: assistantMessage.content,
        role: assistantMessage.role,
        createdAt: assistantMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
