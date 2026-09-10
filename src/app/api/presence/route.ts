import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).employeeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employeeId = (session.user as any).employeeId;

    await prisma.employee.update({
      where: { id: employeeId },
      data: { lastSeenAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update presence", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

