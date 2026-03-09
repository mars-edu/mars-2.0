// convex/http.ts
import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import {
  createLiveKitToken,
  generateRoomName,
  generateParticipantIdentity,
} from './livekit/token';
import { handleChatRequest } from './livekit/chat';

const http = httpRouter();

// ── LiveKit Token Endpoint ────────────────────────────────────────────────────
http.route({
  path: '/api/livekit/token',
  method: 'POST',
  handler: httpAction(async (_ctx, _request) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return new Response(
        JSON.stringify({ error: 'LiveKit credentials not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const roomName = generateRoomName();
    const participantIdentity = generateParticipantIdentity();
    const participantName = 'Пользователь';

    const participantToken = await createLiveKitToken({
      apiKey,
      apiSecret,
      roomName,
      participantIdentity,
      participantName,
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
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }),
});

// ── AI Chat Endpoint ─────────────────────────────────────────────────────────
http.route({
  path: '/api/chat',
  method: 'POST',
  handler: httpAction(async (_ctx, request) => {
    return handleChatRequest(request);
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
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }),
});

export default http;
