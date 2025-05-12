import { prismaClient } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CustomerSchema = z.object({
  customerid: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  amountspent: z.number().nonnegative().optional(),
  lastloggedin: z.coerce.date().optional(),
  lastorderdate: z.coerce.date().optional(),
});
const customerArraySchema = z.array(CustomerSchema);

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  // console.log("Decoded JWT Token:", token);

  if (!token || !token.email) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userEmail = token.email;

  const currUser = await prismaClient.user.findUnique({
    where: { email: userEmail },
  });

  if (!currUser) {
    return NextResponse.json(
      { success: false, message: "User was not found" },
      { status: 404 }
    );
  }

  const id = currUser.id;

  const data = await req.json();
  console.log("Data received from Postman:", data);

  if (!Array.isArray(data)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid data format, must be an array of objects",
      },
      { status: 400 }
    );
  }

  const parse = customerArraySchema.safeParse(data);
  if (!parse.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Data Validation failed. Please input correct form of data",
      },
      { status: 400 }
    );
  }

  const validData = parse.data;

  try {
    const newBatch = await prismaClient.batches.create({
      data: {
        userId: id,
        customerData: {
          create: validData.map((customer) => ({
            customerId: customer.customerid,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            location: customer.location,
            amountSpent: customer.amountspent,
            lastLoggedIn: customer.lastloggedin,
            lastOrderDate: customer.lastorderdate,
            userId: id,
          })),
        },
      },
    });
    return NextResponse.json(
      {
        success: true,
        message:
          "Successfully validated and parsed customer data and created batch",
        batch: newBatch,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error,
      },
      { status: 500 }
    );
  }
}
