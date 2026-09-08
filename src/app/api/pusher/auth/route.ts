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
    const params = new URLSearchParams(data);
    const socketId = params.get("socket_id");
    const channelName = params.get("channel_name");

    if (!socketId || !channelName) {
      return new NextResponse("Missing parameters", { status: 400 });
    }

    const employeeId = (session.user as any).employeeId;

    let authResponse;
    if (channelName.startsWith("presence-")) {
      const presenceData = {
        user_id: employeeId,
        user_info: {
          name: session.user.name,
          role: (session.user as any).role,
        },
      };
      authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
    } else {
      authResponse = pusherServer.authorizeChannel(socketId, channelName);
    }

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("PUSHER_AUTH_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
