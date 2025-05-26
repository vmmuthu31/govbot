import { NextResponse } from "next/server";
import { polkadotService } from "@/services/polkadot";
import { NetworkId } from "@/lib/constants";
import prisma from "@/lib/db";

export const GET = async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const network = (url.searchParams.get("network") ||
      "polkadot") as NetworkId;

    if (!id) {
      return NextResponse.json(
        { error: "Proposal ID is required" },
        { status: 400 }
      );
    }

    const dbProposal = await prisma.proposal.findFirst({
      where: {
        chainId: id,
        network: network,
      },
      include: {
        messages: true,
        vote: true,
      },
    });

    if (dbProposal) {
      return NextResponse.json({ proposal: dbProposal });
    }

    polkadotService.setNetwork(network);
    const onChainProposal = await polkadotService.fetchProposalById(id);

    if (!onChainProposal) {
      return NextResponse.json(
        {
          error: "This proposal is no longer active and cannot be voted on.",
          status: "inactive",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ proposal: onChainProposal });
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the proposal" },
      { status: 500 }
    );
  }
};
