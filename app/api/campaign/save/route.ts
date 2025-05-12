import { authOptions } from "@/lib/auth";
import { prismaClient } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

interface Customer {
  id: string;
  userId: string;
  batchId: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  amountSpent: number;
  lastLoggedIn: string; // Can be Date type if needed
  lastOrderDate: string; // Can be Date type if needed
  createdAt: string; // Can be Date type if needed
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      batchId,
      campaignName,
      campaignMessage,
      matchedCustomers,
      count,
    }: {
      batchId: string;
      campaignName: string;
      campaignMessage: string;
      matchedCustomers: Customer[];
      count: number;
    } = await req.json();

    const user = await prismaClient.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const userId = user.id;
    const decodedBatchId = decodeURIComponent(batchId).replace(/^id=/, "");

    // 1. Create Campaign
    let createdCampaign;
    try {
      createdCampaign = await prismaClient.campaign.create({
        data: {
          userId: userId,
          batchId: decodedBatchId,
          name: campaignName,
          message: campaignMessage,
        },
      });
    } catch (campaignCreationError) {
      return NextResponse.json(
        {
          success: false,
          message: "Campaign Creation Failed : ",
          error: campaignCreationError,
        },
        { status: 500 }
      );
    }

    const campaignId = createdCampaign.id;

    try {
      await prismaClient.communicationLog.create({
        data: {
          campaignId: campaignId,
          userId,
          batchId: decodedBatchId,
          audience: JSON.stringify(matchedCustomers),
          count: count,
          notes:
            "This is a temporary campaign note. You can add your own note instead.",
        },
      });
    } catch (campaignLogCreationError) {
      console.error(
        "Error creating communication log:",
        campaignLogCreationError
      );
      return NextResponse.json(
        {
          success: false,
          message: "Campaign Log Creation Failed : ",
          error: campaignLogCreationError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Successfully added campaign and log" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { success: false, message: "Unexpected error occurred" },
      { status: 500 }
    );
  }
}
