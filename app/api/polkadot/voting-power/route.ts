import { NextRequest, NextResponse } from "next/server";
import { polkadotService } from "@/services/polkadot";

export async function GET() {
  try {
    const votingPower = await polkadotService.getGovBotVotingPower();

    return NextResponse.json({
      address: process.env.POLKADOT_BOT_ADDRESS,
      votingPower,
      formatted: `${parseFloat(votingPower).toLocaleString()} DOT`,
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
    const {
      address,
      amount,
      conviction = 1,
      tracks = [0],
    } = await request.json();

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
