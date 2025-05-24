import { NextRequest, NextResponse } from "next/server";
import { polkadotService } from "@/services/polkadot";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    const balance = await polkadotService.getDetailedBalance(address || undefined);

    return NextResponse.json({
      success: true,
      balance,
      summary: {
        address: balance.address,
        totalDOT: `${parseFloat(balance.formatted.total).toLocaleString()} DOT`,
        freeDOT: `${parseFloat(balance.formatted.free).toLocaleString()} DOT`,
        transferableDOT: `${parseFloat(balance.formatted.transferable).toLocaleString()} DOT`,
      }
    });
  } catch (error) {
    console.error("Error getting balance:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to get balance",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { addresses } = await request.json();

    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json(
        { error: "Array of addresses is required" },
        { status: 400 }
      );
    }

    const balances = await Promise.all(
      addresses.map(async (addr: string) => {
        try {
          const balance = await polkadotService.getDetailedBalance(addr);
          return {
            success: true,
            ...balance,
            summary: {
              totalDOT: `${parseFloat(balance.formatted.total).toLocaleString()} DOT`,
              freeDOT: `${parseFloat(balance.formatted.free).toLocaleString()} DOT`,
              transferableDOT: `${parseFloat(balance.formatted.transferable).toLocaleString()} DOT`,
            }
          };
        } catch (error) {
          return {
            success: false,
            address: addr,
            error: error instanceof Error ? error.message : "Unknown error"
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      balances
    });
  } catch (error) {
    console.error("Error getting multiple balances:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to get balances",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
