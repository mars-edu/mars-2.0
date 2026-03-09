// convex/livekit/chat.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from 'ai';
import { MARS_SYSTEM_PROMPT } from './marsSystemPrompt';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function errorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
  );
}

export async function handleChatRequest(request: Request): Promise<Response> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    return errorResponse('GOOGLE_API_KEY not configured', 500);
  }

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

  try {
    const google = createGoogleGenerativeAI({ apiKey: googleApiKey });
    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: MARS_SYSTEM_PROMPT,
      messages: modelMessages,
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
