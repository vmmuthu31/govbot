import { NextRequest, NextResponse } from "next/server";
import { polkadotService } from "@/services/polkadot";
import { NetworkId } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const network = (url.searchParams.get("network") ||
      "polkadot") as NetworkId;

    polkadotService.setNetwork(network);

    const activeProposals = await polkadotService.getActiveProposals();

    return NextResponse.json({
      network,
      activeProposals,
      count: activeProposals.length,
      message:
        activeProposals.length > 0
          ? `Found ${activeProposals.length} active proposals on ${network}`
          : `No active proposals found on ${network}`,
    });
  } catch (error) {
    console.error("Error fetching active proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch active proposals" },
      { status: 500 }
    );
  }
}
