// convex/livekit/token.ts
import { SignJWT } from 'jose';

export interface TokenOptions {
  apiKey: string;
  apiSecret: string;
  roomName: string;
  participantIdentity: string;
  participantName: string;
  ttlSeconds?: number;
}

export interface ConnectionDetails {
  serverUrl: string;
  roomName: string;
  participantToken: string;
  participantName: string;
}

export async function createLiveKitToken(opts: TokenOptions): Promise<string> {
  const secret = new TextEncoder().encode(opts.apiSecret);
  const now = Math.floor(Date.now() / 1000);
  const ttl = opts.ttlSeconds ?? 900; // 15 minutes default

  const token = await new SignJWT({
    video: {
      room: opts.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(opts.apiKey)
    .setSubject(opts.participantIdentity)
    .setNotBefore(now)
    .setIssuedAt(now)
    .setExpirationTime(now + ttl)
    .sign(secret);

  return token;
}

export function generateRoomName(): string {
  const id = Math.random().toString(36).substring(2, 10);
  return `mars_room_${id}`;
}

export function generateParticipantIdentity(): string {
  const id = Math.random().toString(36).substring(2, 10);
  return `mars_user_${id}`;
}
