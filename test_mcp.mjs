import { spawn } from 'child_process';

const mcp = spawn('npx', ['-y', '@playwright/mcp@latest', '--headless', '--isolated']);

mcp.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id === 1) {
        // Wait 3 seconds for page F7 transitions and data fetch
        setTimeout(() => {
          const req2 = {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: {
              name: "browser_console_messages",
              arguments: { level: "info", all: true }
            }
          };
          mcp.stdin.write(JSON.stringify(req2) + '\n');
        }, 3000);
      } else if (msg.id === 2) {
        console.log("CONSOLE MESSAGES:");
        console.log(JSON.stringify(msg, null, 2));
        mcp.kill();
      }
    } catch (e) {
      // not json
    }
  }
});

setTimeout(() => {
  const req1 = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "browser_navigate",
      arguments: { url: "http://localhost:5173/journals/j9770kjey7dqg6ynkhnmxdta2n7z5k57?from=journals" }
    }
  };
  mcp.stdin.write(JSON.stringify(req1) + '\n');
}, 2000);

