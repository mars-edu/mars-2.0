import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import superjson from "superjson";
import { applyPatch, compare } from "fast-json-patch";
import type { Env } from "../types/env.js";
import { DurableObject } from "cloudflare:workers";

export class WebSocketDurableObject extends DurableObject {
  prisma: PrismaClient;
  sockets: WebSocket[] = [];

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    const adapter = new PrismaD1(env.DB);
    this.prisma = new PrismaClient({ adapter });
  }

  async fetch(request: Request) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.handleWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  handleWebSocket(socket: WebSocket) {
    socket.accept();
    this.sockets.push(socket);

    socket.addEventListener("message", async (event: MessageEvent) => {
      try {
        const message: {
          type: string;
          state?: string;
          storeId?: string;
          patch?: any;
          timestamp?: number;
        } = superjson.parse(event.data);

        if (
          message.type === "STATE_PATCH" &&
          message.patch &&
          message.storeId
        ) {
          const currentRecord = await this.prisma.piniaState.findUnique({
            where: { storeId: message.storeId },
          });

          if (!currentRecord) return;

          const clientLastKnownTimestamp = message.timestamp || 0;
          const serverTimestamp = currentRecord.updatedAt.getTime();

          if (clientLastKnownTimestamp < serverTimestamp) {
            const conflictResponseMessage = {
              type: "STATE_UPDATE",
              storeId: currentRecord.storeId,
              state: currentRecord.state,
              timestamp: serverTimestamp,
            };
            socket.send(superjson.stringify(conflictResponseMessage));
            return;
          }

          const currentDoc = superjson.parse(currentRecord.state);
          const { newDocument } = applyPatch(
            currentDoc,
            message.patch,
            true,
            false
          );
          const newState = superjson.stringify(newDocument);

          const updatedRecord = (await this.prisma.piniaState.update({
            where: { storeId: message.storeId },
            data: { state: newState },
          })) as { state: string; storeId: string; updatedAt: Date };

          const broadcastMessage = {
            type: "STATE_PATCH",
            storeId: updatedRecord.storeId,
            patch: message.patch,
            timestamp: updatedRecord.updatedAt.getTime(),
          };

          this.broadcast(superjson.stringify(broadcastMessage), socket);
        } else if (
          message.type === "STATE_UPDATE" &&
          message.state &&
          message.storeId
        ) {
          const currentRecord = await this.prisma.piniaState.findUnique({
            where: { storeId: message.storeId },
          });

          if (currentRecord && currentRecord.state === message.state) {
            return;
          }

          const clientLastKnownTimestamp = message.timestamp || 0;
          const serverTimestamp = currentRecord
            ? currentRecord.updatedAt.getTime()
            : 0;

          if (clientLastKnownTimestamp < serverTimestamp && currentRecord) {
            const conflictResponseMessage = {
              type: "STATE_UPDATE",
              storeId: currentRecord.storeId,
              state: currentRecord.state,
              timestamp: serverTimestamp,
            };
            socket.send(superjson.stringify(conflictResponseMessage));
            return;
          }

          const updatedRecord = (await this.prisma.piniaState.upsert({
            where: { storeId: message.storeId },
            update: { state: message.state },
            create: { storeId: message.storeId, state: message.state },
          })) as { state: string; storeId: string; updatedAt: Date };
          const broadcastMessage = {
            type: "STATE_UPDATE",
            storeId: updatedRecord.storeId,
            state: updatedRecord.state,
            timestamp: updatedRecord.updatedAt.getTime(),
          };
          this.broadcast(superjson.stringify(broadcastMessage), socket);
        } else if (message.type === "SYNC_REQUEST" && message.storeId) {
          let record = await this.prisma.piniaState.findUnique({
            where: { storeId: message.storeId },
          });

          if (!record) {
            const emptyState = superjson.stringify({});
            record = await this.prisma.piniaState.create({
              data: {
                storeId: message.storeId,
                state: emptyState,
              },
            });
          }

          const response = {
            type: "STATE_UPDATE",
            state: record.state,
            storeId: record.storeId,
            timestamp: record.updatedAt.getTime(),
          };
          socket.send(superjson.stringify(response));
        }
      } catch (error) {
        console.error("[WS DO] Failed to process message", error);
      }
    });

    socket.addEventListener("close", () => {
      this.sockets = this.sockets.filter((s) => s !== socket);
    });

    socket.addEventListener("error", (error) => {
      console.error("[WS DO] WebSocket error:", error);
      this.sockets = this.sockets.filter((s) => s !== socket);
    });
  }

  broadcast(message: string, sender: WebSocket | null = null) {
    this.sockets.forEach((socket) => {
      if (socket !== sender && socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    });
  }
}
