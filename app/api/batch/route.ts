import { prismaClient } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // adjust the path if needed

export const GET = async () => {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prismaClient.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const batches = await prismaClient.batches.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Successfully retrieved your batches",
        batches: batches,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user batches:", error);
    return NextResponse.json(
      { message: "Failed to fetch user batches" },
      { status: 500 }
    );
  }
};
