import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Proposal ID is required" },
        { status: 400 }
      );
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        vote: true,
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the proposal" },
      { status: 500 }
    );
  }
}
