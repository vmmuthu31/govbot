import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  fetchActiveReferenda,
  fetchProposalFromPolkassembly,
} from "@/services/polkasembly";
import { v4 as uuidv4 } from "uuid";
import { NetworkId } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const activeQuery = searchParams.get("activeQuery") || "";
    const importedQuery = searchParams.get("importedQuery") || "";
    const network = (searchParams.get("network") || "polkadot") as NetworkId;

    const activeProposals = await prisma.proposal.findMany({
      where: {
        source: "active",
        network,
        ...(activeQuery
          ? {
              OR: [
                { title: { contains: activeQuery, mode: "insensitive" } },
                { description: { contains: activeQuery, mode: "insensitive" } },
                { chainId: { contains: activeQuery, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { vote: true },
    });

    const importedProposals = await prisma.proposal.findMany({
      where: {
        source: "imported",
        network,
        ...(importedQuery
          ? {
              OR: [
                { title: { contains: importedQuery, mode: "insensitive" } },
                {
                  description: { contains: importedQuery, mode: "insensitive" },
                },
                { chainId: { contains: importedQuery, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { vote: true },
    });

    return NextResponse.json({ activeProposals, importedProposals });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching proposals" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const network = (searchParams.get("network") || "polkadot") as NetworkId;
    const polkassemblyProposals = await fetchActiveReferenda(network);

    const savedProposals = [];
    for (const proposal of polkassemblyProposals) {
      const existingProposal = await prisma.proposal.findFirst({
        where: {
          chainId: proposal.chainId,
          network: network,
        },
      });
      if (!existingProposal) {
        const savedProposal = await prisma.proposal.create({
          data: {
            id: uuidv4(),
            chainId: proposal.chainId,
            title: proposal.title,
            description: proposal.description,
            contentSummary: proposal.contentSummary,
            proposer: proposal.proposer,
            track: proposal.track,
            source: "active",
            network,
            createdAt: new Date(proposal.createdAt),
            updatedAt: new Date(),
          },
        });
        savedProposals.push(savedProposal);
      } else {
        console.info(
          `Proposal ${proposal.chainId} already exists on ${network}`
        );
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
    const { chainId, network: requestNetwork } = await req.json();
    const network = (requestNetwork || "polkadot") as NetworkId;
    if (!chainId) {
      return NextResponse.json(
        { error: "Chain ID is required" },
        { status: 400 }
      );
    }
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        chainId,
        network,
      },
    });
    if (existingProposal) {
      return NextResponse.json({
        message: "Proposal already exists",
        proposal: existingProposal,
      });
    }
    const proposal = await fetchProposalFromPolkassembly(chainId, network);
    const savedProposal = await prisma.proposal.create({
      data: {
        id: uuidv4(),
        chainId: proposal.chainId,
        title: proposal.title,
        description: proposal.description,
        contentSummary: proposal.contentSummary,
        proposer: proposal.proposer,
        track: proposal.track,
        source: "imported",
        network,
        createdAt: new Date(proposal.createdAt),
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ proposal: savedProposal });
  } catch (error) {
    console.error("Error importing individual proposal:", error);
    return NextResponse.json(
      { error: "An error occurred while importing the proposal" },
      { status: 500 }
    );
  }
}
