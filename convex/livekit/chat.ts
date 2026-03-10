// convex/livekit/chat.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import type { ActionCtx } from '../_generated/server';
import { api } from '../_generated/api';
import { validateToken } from '../auth/helpers';
import { buildSystemPrompt } from './marsSystemPrompt';
import { createMarsTools, type ResolvedUser } from './tools';
import type { Id } from '../_generated/dataModel';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

async function resolveUser(
  ctx: ActionCtx,
  token: string,
): Promise<ResolvedUser | null> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;

  let payload: { userId: string; roles: string[] };
  try {
    payload = await validateToken(token, jwtSecret);
  } catch {
    return null;
  }

  const userId = payload.userId as Id<'users'>;
  const profile = await ctx.runQuery(api.users.queries.getUserProfile, {
    userId,
  });
  if (!profile) return null;

  let teacherId: Id<'teachers'> | undefined;
  let studentId: string | undefined;

  if (payload.roles.includes('TEACHER')) {
    const teacher = await ctx.runQuery(api.teachers.queries.getByUserId, {
      userId,
    });
    teacherId = teacher?._id;
  }

  if (payload.roles.includes('STUDENT')) {
    // Students table has no userId — resolve by name match
    const matches = await ctx.runQuery(api.students.queries.search, {
      searchTerm: profile.firstName,
    });
    const match = (matches as any[]).find(
      (s: any) =>
        s.firstName === profile.firstName && s.surname === profile.lastName,
    );
    studentId = match?._id;
  }

  return {
    userId,
    roles: payload.roles,
    firstName: profile.firstName,
    lastName: profile.lastName,
    teacherId,
    studentId,
  };
}

export async function handleChatRequest(
  ctx: ActionCtx,
  request: Request,
): Promise<Response> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    return errorResponse('GOOGLE_API_KEY not configured', 500);
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const user = token ? await resolveUser(ctx, token) : null;

  // ── Body ──────────────────────────────────────────────────────────────────
  let messages: UIMessage[];
  try {
    const body = await request.json();
    messages = body.messages as UIMessage[];
  } catch {
    return errorResponse('Invalid request body', 400);
  }

  let modelMessages;
  try {
    modelMessages = await convertToModelMessages(messages);
  } catch {
    return errorResponse('Failed to convert messages', 400);
  }

  // ── Stream ────────────────────────────────────────────────────────────────
  try {
    const google = createGoogleGenerativeAI({ apiKey: googleApiKey });
    const tools = user ? createMarsTools(ctx, user) : undefined;

    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: buildSystemPrompt(user),
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(5),
    });

    const streamResponse = result.toUIMessageStreamResponse();
    const headers = new Headers(streamResponse.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      headers.set(key, value);
    }
    return new Response(streamResponse.body, {
      status: streamResponse.status,
      headers,
    });
  } catch {
    return errorResponse('AI service error', 500);
  }
}
