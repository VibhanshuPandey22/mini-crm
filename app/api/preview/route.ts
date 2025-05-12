import { NextResponse } from "next/server";
import { prismaClient } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";

interface Rule {
  field?: string;
  operator?: string;
  value?: string;
  condition?: "AND" | "OR";
  rules?: Rule[];
}

function parseValue(field: string, value: string) {
  const numericFields = ["amountSpent"];
  const dateFields = ["lastLoggedIn", "createdAt"];

  if (numericFields.includes(field)) return parseFloat(value);
  if (dateFields.includes(field)) return new Date(value);
  return value;
}

function buildPrismaFilter({
  rules,
}: {
  condition: "AND" | "OR";
  rules: Rule[];
}): Prisma.CustomerDataWhereInput[] {
  return rules.map((rule) => {
    const { field, operator, value } = rule;

    if (!field || !operator || value === undefined) return {};

    let prismaCondition;

    switch (operator) {
      case "=":
        prismaCondition = { equals: parseValue(field, value) };
        break;
      case "!=":
        prismaCondition = { not: { equals: parseValue(field, value) } };
        break;
      case ">":
        prismaCondition = { gt: parseValue(field, value) };
        break;
      case "<":
        prismaCondition = { lt: parseValue(field, value) };
        break;
      case ">=":
        prismaCondition = { gte: parseValue(field, value) };
        break;
      case "<=":
        prismaCondition = { lte: parseValue(field, value) };
        break;
      case "contains":
        prismaCondition = {
          contains: parseValue(field, value),
          mode: "insensitive",
        };
        break;
      case "not contains":
        prismaCondition = {
          not: {
            contains: parseValue(field, value),
          },
          mode: "insensitive",
        };
        break;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }

    return { [field]: prismaCondition };
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      condition,
      rules,
      batchId,
    }: { condition: "AND" | "OR"; rules: Rule[]; batchId: string } =
      await req.json();

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

    const baseWhere = {
      userId,
      batchId: decodedBatchId,
    };

    const filters = buildPrismaFilter({ condition, rules });

    const whereClause =
      condition === "AND"
        ? { AND: [baseWhere, ...filters] }
        : { AND: [baseWhere], OR: filters };

    const data = await prismaClient.customerData.findMany({
      where: whereClause,
    });
    console.log(data);
    const count = await prismaClient.customerData.count({
      where: whereClause,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Successfully retrieved matching customer data",
        count: count,
        matchedCustomers: data,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Preview error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to preview audience" },
      { status: 500 }
    );
  }
}
