import { NextRequest, NextResponse } from "next/server";
import { polkadotService } from "@/services/polkadot";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/db";
import { fetchProposalFromPolkassembly } from "@/services/polkasembly";
import { NetworkId } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const network = (searchParams.get("network") || "polkadot") as NetworkId;
    polkadotService.setNetwork(network);
    const onChainProposals = await polkadotService.fetchOnChainProposals();

    return NextResponse.json({
      proposals: onChainProposals,
      count: onChainProposals.length,
    });
  } catch (error) {
    console.error("Error fetching on-chain proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch on-chain proposals" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const network = (searchParams.get("network") || "polkadot") as NetworkId;
    polkadotService.setNetwork(network);
    const onChainProposals = await polkadotService.fetchOnChainProposals();

    const savedProposals = [];
    const errors = [];

    for (const proposal of onChainProposals) {
      try {
        const existingProposal = await prisma.proposal.findFirst({
          where: { chainId: proposal.id },
        });

        if (existingProposal) {
          continue;
        }

        let polkassemblyData;
        try {
          polkassemblyData = await fetchProposalFromPolkassembly(
            proposal.id,
            network
          );
        } catch (polkErr) {
          console.warn(
            `Could not fetch from Polkassembly for proposal ${proposal.id}:`,
            polkErr
          );

          polkassemblyData = {
            chainId: proposal.id,
            title: `Referendum #${proposal.id}`,
            description: `On-chain proposal on track ${proposal.track}. Details: ${proposal.proposal}`,
            contentSummary: proposal.contentSummary || "",
            proposer: proposal.proposer,
            track: proposal.track,
            createdAt: new Date(parseInt(proposal.submitted)).toISOString(),
          };
        }

        const savedProposal = await prisma.proposal.create({
          data: {
            id: uuidv4(),
            chainId: proposal.id,
            title: polkassemblyData.title,
            description: polkassemblyData.description,
            contentSummary:
              polkassemblyData.contentSummary || proposal.contentSummary || "",
            proposer: polkassemblyData.proposer,
            track: polkassemblyData.track || proposal.track,
            network,
            createdAt: new Date(polkassemblyData.createdAt),
            updatedAt: new Date(),
          },
        });

        savedProposals.push(savedProposal);
      } catch (err) {
        console.error(`Error processing proposal ${proposal.id}:`, err);
        errors.push({
          proposalId: proposal.id,
          error: err || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: `Imported ${savedProposals.length} new proposals from the blockchain`,
      proposals: savedProposals,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error importing on-chain proposals:", error);
    return NextResponse.json(
      { error: "Failed to import on-chain proposals" },
      { status: 500 }
    );
  }
}
