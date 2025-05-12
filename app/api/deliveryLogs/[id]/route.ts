// app/api/deliveryLogs/route.js (App Router)
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const logs = await prisma.deliveryLog.findMany({
      where: { communicationLogId: id },
      orderBy: { createdAt: "desc" }, // optional: show latest first
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to fetch delivery logs" },
      { status: 500 }
    );
  }
}
