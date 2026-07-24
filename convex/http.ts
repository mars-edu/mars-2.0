// convex/http.ts
import { httpRouter } from 'convex/server';
import { httpAction } from "./functions";
import {
  createLiveKitToken,
  generateRoomName,
  generateParticipantIdentity,
} from './livekit/token';
import { handleChatRequest } from './livekit/chat';
import { handleToolRequest } from './livekit/toolEndpoint';

const http = httpRouter();

// ── LiveKit Token Endpoint ────────────────────────────────────────────────────
http.route({
  path: '/api/livekit/token',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return new Response(
        JSON.stringify({ error: 'LiveKit credentials not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const authHeader = request.headers.get('Authorization') ?? '';
    const userToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    const roomName = generateRoomName();
    const participantIdentity = generateParticipantIdentity();
    const participantName = 'Пользователь';

    const participantToken = await createLiveKitToken({
      apiKey,
      apiSecret,
      roomName,
      participantIdentity,
      participantName,
      metadata: userToken ? JSON.stringify({ token: userToken }) : undefined,
    });

    return new Response(
      JSON.stringify({
        serverUrl,
        roomName,
        participantToken,
        participantName,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }),
});

// CORS preflight for token endpoint
http.route({
  path: '/api/livekit/token',
  method: 'OPTIONS',
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }),
});

// ── AI Chat Endpoint ─────────────────────────────────────────────────────────
http.route({
  path: '/api/chat',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    return handleChatRequest(ctx, request);
  }),
});

http.route({
  path: '/api/chat',
  method: 'OPTIONS',
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }),
});

// ── LiveKit Tool Endpoint ────────────────────────────────────────────────────
http.route({
  path: '/api/livekit/tool',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    return handleToolRequest(ctx, request);
  }),
});

http.route({
  path: '/api/livekit/tool',
  method: 'OPTIONS',
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }),
});

export default http;
