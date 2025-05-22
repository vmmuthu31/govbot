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
    const { address, amount, conviction = 1 } = await request.json();

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

    const txHash = await polkadotService.delegateVotingPower(
      address,
      amount,
      conviction
    );

    return NextResponse.json({
      success: true,
      message: "Delegation transaction prepared",
      address,
      delegate: process.env.POLKADOT_BOT_ADDRESS,
      amount,
      conviction,
      txHash,
      note: "This is a simulated transaction. In production, this would need to be signed by the delegator.",
    });
  } catch (error) {
    console.error("Error delegating voting power:", error);
    return NextResponse.json(
      { error: "Failed to delegate voting power" },
      { status: 500 }
    );
  }
}
