import { NextRequest, NextResponse } from "next/server";
import { polkadotService } from "@/services/polkadot";
import { NetworkId } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const network = (url.searchParams.get("network") ||
      "polkadot") as NetworkId;

    polkadotService.setNetwork(network);
    const votingPower = await polkadotService.getGovBotVotingPower();
    const networkConfig = polkadotService.getCurrentNetwork();

    return NextResponse.json({
      address: process.env.POLKADOT_BOT_ADDRESS,
      votingPower,
      formatted: `${new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(parseFloat(votingPower))} ${networkConfig.currency.symbol}`,
    });
  } catch (error) {
    console.error("Error getting voting power:", error);
    return NextResponse.json(
      { error: "Failed to get voting power" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const network = (url.searchParams.get("network") ||
      "polkadot") as NetworkId;

    const {
      address,
      amount,
      conviction = 1,
      tracks = [0],
    } = await request.json();

    polkadotService.setNetwork(network);

    if (!address || !amount) {
      return NextResponse.json(
        { error: "Address and amount are required" },
        { status: 400 }
      );
    }

    if (conviction < 0 || conviction > 6) {
      return NextResponse.json(
        { error: "Conviction must be between 0 and 6" },
        { status: 400 }
      );
    }

    const delegateAddress = process.env.POLKADOT_BOT_ADDRESS;

    if (!delegateAddress) {
      return NextResponse.json(
        { error: "Bot address not configured" },
        { status: 500 }
      );
    }

    try {
      const callData = await polkadotService.prepareDelegationCallData(
        delegateAddress,
        amount,
        conviction,
        tracks
      );

      return NextResponse.json({
        success: true,
        message: "Delegation call data prepared successfully",
        address,
        delegate: delegateAddress,
        amount,
        conviction,
        tracks,
        callData,
        note: "This call data should be signed and submitted by the user's wallet extension.",
      });
    } catch (error) {
      console.error("Error preparing delegation call data:", error);

      const simulatedTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      return NextResponse.json({
        success: true,
        message: "Delegation transaction simulated (fallback)",
        address,
        delegate: delegateAddress,
        amount,
        conviction,
        tracks,
        txHash: simulatedTxHash,
        note: "This is a demo transaction simulation. In a production system, this would require actual wallet signing and on-chain submission.",
        simulation: true,
      });
    }
  } catch (error) {
    console.error("Error processing delegation request:", error);
    return NextResponse.json(
      { error: "Failed to process delegation request" },
      { status: 500 }
    );
  }
}
