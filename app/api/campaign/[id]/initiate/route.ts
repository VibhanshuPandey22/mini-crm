import { prismaClient } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

interface Customer {
  id: string;
  name: string;
  userId: string;
}
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params; //this id is the communication log id.
  const data = await req.json();
  const newStatus = data.status;

  try {
    const campaign = await prismaClient.communicationLog.findUnique({
      where: { id: id },
    });
    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          message: "Campaign not found",
        },
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
        {
          success: true,
          message: "Successfully updated the campaign status",
        },
        { status: 200 }
      );
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        {
          success: true,
          message: "Successfully updated the campaign status",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}

interface Customer {
  name: string;
  userId: string;
  id: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

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
      },
      { status: 500 }
    );
  }
}
