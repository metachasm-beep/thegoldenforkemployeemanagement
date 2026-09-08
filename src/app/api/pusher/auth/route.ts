import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await req.text();
    const [socketId, channelName] = data
      .split("&")
      .map((str) => str.split("=")[1]);

    const employeeId = (session.user as any).employeeId;
    const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: employeeId,
      user_info: {
        name: session.user.name,
      },
    });

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("PUSHER_AUTH_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
