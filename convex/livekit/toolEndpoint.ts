import type { ActionCtx } from '../_generated/server';
import { createMarsTools } from './tools';
import { resolveUser } from './chat';

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

export async function handleToolRequest(ctx: ActionCtx, request: Request): Promise<Response> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const user = token ? await resolveUser(ctx, token) : null;

  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const { tool, args } = body;
  if (!tool || typeof tool !== 'string') {
    return errorResponse('Missing tool name', 400);
  }

  const tools = createMarsTools(ctx, user);
  const selectedTool = tools[tool];

  if (!selectedTool) {
    return errorResponse('Tool not found', 404);
  }

  try {
    // Vercel AI dynamicTool returns an object with `execute` or we can call it.
    if (typeof selectedTool.execute !== 'function') {
      return errorResponse('Tool is not executable', 500);
    }
    const result = await selectedTool.execute(args || {}, { toolCallId: 'manual', messages: [] } as any);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Error executing tool', 500);
  }
}
