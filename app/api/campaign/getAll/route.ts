import { NextResponse } from "next/server";
import { prismaClient } from "@/lib/db";

export async function GET() {
  try {
    const logs = await prismaClient.communicationLog.findMany({
      include: {
        campaign: {
          select: {
            name: true,
            message: true,
            status: true,
          },
        },
        batch: {
          select: {
            batchName: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        deliveryTime: "desc",
      },
    });
    return NextResponse.json(
      { success: true, message: "Successfully retireved all logs", logs: logs },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching communication logs:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch communication logs" },
      { status: 500 }
    );
  }
}
