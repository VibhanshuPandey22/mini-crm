import { prismaClient } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PATCH handler to update campaign status
export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } } // Correctly use context for dynamic params
) {
  const { id } = context.params; // This id is the communication log id.
  const data = await req.json();
  const newStatus = data.status;

  try {
    const campaign = await prismaClient.communicationLog.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, message: "Campaign not found" },
        { status: 404 }
      );
    }

    const campaignId = campaign.campaignId;

    try {
      await prismaClient.campaign.update({
        where: { id: campaignId },
        data: {
          status: newStatus,
        },
      });
      return NextResponse.json(
        { success: true, message: "Successfully updated the campaign status" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error updating campaign status:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Error updating the campaign status",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in PATCH handler:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating the campaign status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST handler to create delivery logs
interface Customer {
  id: string;
  name: string;
  userId: string;
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } } // Correct context usage for dynamic route params
) {
  const { id } = context.params; // Extract id from context

  try {
    const log = await prismaClient.communicationLog.findUnique({
      where: { id },
      include: {
        campaign: true, // This includes the related campaign
      },
    });

    if (!log || !log.campaign) {
      return NextResponse.json(
        { success: false, message: "Log or associated campaign not found" },
        { status: 404 }
      );
    }

    const parsedAudience: Customer[] =
      typeof log.audience === "string"
        ? JSON.parse(log.audience)
        : log.audience;

    if (!Array.isArray(parsedAudience)) {
      throw new Error("Audience data is not in expected format");
    }

    const shuffledAudience = [...parsedAudience].sort(
      () => 0.5 - Math.random()
    );
    const successThreshold = Math.floor(shuffledAudience.length * 0.9);

    await Promise.all(
      shuffledAudience.map(async (customer, index) => {
        const deliveryStatus = index < successThreshold ? "Sent" : "Failed";

        await prismaClient.deliveryLog.create({
          data: {
            customerName: customer.name,
            message: log.campaign.message,
            status: deliveryStatus,
            userId: log.userId,
            campaignId: log.campaignId,
            communicationLogId: id,
          },
        });
      })
    );

    return NextResponse.json(
      { success: true, message: "Delivery logs created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating delivery logs:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create delivery logs",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
