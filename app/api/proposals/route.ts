import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  fetchActiveReferenda,
  fetchProposalFromPolkassembly,
} from "@/services/polkasembly";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const proposals = await prisma.proposal.findMany({
      orderBy: { createdAt: "desc" },
      include: { vote: true },
    });

    return NextResponse.json({ proposals });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching proposals" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const polkassemblyProposals = await fetchActiveReferenda();

    const savedProposals = [];

    for (const proposal of polkassemblyProposals) {
      const existingProposal = await prisma.proposal.findUnique({
        where: { chainId: proposal.chainId },
      });

      if (!existingProposal) {
        const savedProposal = await prisma.proposal.create({
          data: {
            id: uuidv4(),
            chainId: proposal.chainId,
            title: proposal.title,
            description: proposal.description,
            proposer: proposal.proposer,
            track: proposal.track,
            createdAt: new Date(proposal.createdAt),
            updatedAt: new Date(),
          },
        });

        savedProposals.push(savedProposal);
      }
    }

    return NextResponse.json({
      message: `Imported ${savedProposals.length} new proposals`,
      proposals: savedProposals,
    });
  } catch (error) {
    console.error("Error importing proposals:", error);
    return NextResponse.json(
      { error: "An error occurred while importing proposals" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { chainId } = await req.json();

    if (!chainId) {
      return NextResponse.json(
        { error: "Chain ID is required" },
        { status: 400 }
      );
    }

    const existingProposal = await prisma.proposal.findUnique({
      where: { chainId },
    });

    if (existingProposal) {
      return NextResponse.json({
        message: "Proposal already exists",
        proposal: existingProposal,
      });
    }

    const proposal = await fetchProposalFromPolkassembly(chainId);

    const savedProposal = await prisma.proposal.create({
      data: {
        id: uuidv4(),
        chainId: proposal.chainId,
        title: proposal.title,
        description: proposal.description,
        proposer: proposal.proposer,
        track: proposal.track,
        createdAt: new Date(proposal.createdAt),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ proposal: savedProposal });
  } catch (error) {
    console.error("Error fetching individual proposal:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the proposal" },
      { status: 500 }
    );
  }
}
