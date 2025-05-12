import { prismaClient } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const DELETE = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { id } = params; // batchId

  try {
    // Step 1: Get all campaign IDs for this batch
    const campaigns = await prismaClient.campaign.findMany({
      where: { batchId: id },
      select: { id: true },
    });

    const campaignIds = campaigns.map((campaign) => campaign.id);

    // Step 2: Run everything in a single transaction
    await prismaClient.$transaction([
      prismaClient.deliveryLog.deleteMany({
        where: {
          communicationLog: {
            campaignId: { in: campaignIds },
          },
        },
      }),
      prismaClient.communicationLog.deleteMany({
        where: { campaignId: { in: campaignIds } },
      }),
      prismaClient.customerData.deleteMany({
        where: { batchId: id },
      }),
      prismaClient.campaign.deleteMany({
        where: { batchId: id },
      }),
      prismaClient.batches.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json(
      { success: true, message: "Batch and related data deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Error deleting batch", error },
      { status: 500 }
    );
  }
};

export const PATCH = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { id } = await params;
  const data = await req.json();
  const { newBatchName } = data;

  try {
    await prismaClient.batches.update({
      where: { id: id },
      data: { batchName: newBatchName },
    });
    return NextResponse.json(
      { success: true, message: "Batch updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: "Error updating batch", error },
      { status: 500 }
    );
  }
};

// await prismaClient.campaign.deleteMany({
//   where: { batchId: id },
// });
