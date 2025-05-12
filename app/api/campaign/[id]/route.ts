import { prismaClient } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const data = await req.json();
  const { newNote, newMessage } = data;

  if (newNote === undefined && newMessage === undefined) {
    return NextResponse.json(
      {
        success: false,
        message: "Provide either a message or a note to update",
      },
      { status: 402 }
    );
  }

  if (newNote) {
    try {
      await prismaClient.communicationLog.update({
        where: { id: id },
        data: { notes: newNote },
      });
      return NextResponse.json(
        { success: true, message: "Campaign Log updated successfully" },
        { status: 200 }
      );
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        { success: false, message: "Error updating campaign log", error },
        { status: 500 }
      );
    }
  } else {
    try {
      const campaignLog = await prismaClient.communicationLog.findUnique({
        where: { id: id },
      });
      if (!campaignLog) {
        return NextResponse.json(
          { success: false, message: "Campaign log not found" },
          { status: 404 }
        );
      }
      const campaignId = campaignLog.campaignId;
      try {
        const campaign = await prismaClient.campaign.findUnique({
          where: { id: campaignId },
        });

        if (!campaign) {
          return NextResponse.json(
            { success: false, message: "Campaign not found" },
            { status: 404 }
          );
        }

        await prismaClient.campaign.update({
          where: { id: campaignId },
          data: {
            message: newMessage,
          },
        });
        return NextResponse.json(
          {
            success: true,
            message: "Campaign message updated successfully",
          },
          { status: 200 }
        );
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            message: "Error updating campaign message : ",
            error,
          },
          { status: 500 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Error updating campaign message : ",
          error,
        },
        { status: 500 }
      );
    }
  }
}

export const DELETE = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const { id } = await params; //this is the campaign id
  console.log(id);
  try {
    // Step 1: Find all campaign IDs associated with the batch
    const campaignLog = await prismaClient.communicationLog.findUnique({
      where: { id: id },
    });
    console.log(campaignLog);

    if (!campaignLog) {
      return NextResponse.json(
        { success: false, message: "Campaign log not found" },
        { status: 404 }
      );
    }
    const campaignId = campaignLog.campaignId;
    console.log(campaignId);
    try {
      const campaign = await prismaClient.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        return NextResponse.json(
          { success: false, message: "Campaign not found" },
          { status: 404 }
        );
      }

      await prismaClient.$transaction([
        prismaClient.deliveryLog.deleteMany({
          where: {
            communicationLogId: id,
          },
        }),
        prismaClient.communicationLog.delete({
          where: { id: id },
        }),
        prismaClient.campaign.delete({
          where: { id: campaignId },
        }),
      ]);
      return NextResponse.json(
        {
          success: true,
          message: "Campaign and related log deleted successfully",
        },
        { status: 200 }
      );
    } catch (error) {
      console.log(error);
      return NextResponse.json(
        {
          success: false,
          message: "Error deleting Campaign and related log : ",
          error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        message: "Error deleting Campaign and related log : ",
        error,
      },
      { status: 500 }
    );
  }
};
