// convex/livekit/chat.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from 'ai';
import { MARS_SYSTEM_PROMPT } from './marsSystemPrompt';

export async function handleChatRequest(request: Request): Promise<Response> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    return new Response(
      JSON.stringify({ error: 'GOOGLE_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let messages: UIMessage[];
  try {
    const body = await request.json();
    messages = body.messages as UIMessage[];
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const google = createGoogleGenerativeAI({ apiKey: googleApiKey });

  const result = streamText({
    model: google('gemini-2.0-flash'),
    system: MARS_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  });

  const response = result.toUIMessageStreamResponse();

  // Add CORS headers
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
