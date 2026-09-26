import { PrismaClient } from "@prisma/client";
import { sendMessage } from "./src/app/chatActions";
import webpush from "./src/lib/webpush";

const prisma = new PrismaClient();

// Mock webpush to intercept the call
const originalSend = webpush.sendNotification;
let pushCalled = false;
let pushPayload: any = null;

(webpush as any).sendNotification = async (sub: any, payload: string) => {
  pushCalled = true;
  pushPayload = payload;
  console.log("Web Push Intercepted! Sending to:", sub.endpoint);
  console.log("Payload:", payload);
  // Throw 410 Gone to simulate expired subscription and test deletion logic
  throw { statusCode: 410 };
};

// Mock getSessionUser
jest.mock("./src/app/chatActions", () => {
   const original = jest.requireActual("./src/app/chatActions");
   return {
     ...original,
     getSessionUser: async () => ({ employeeId: "SENDER_ID" })
   };
});

