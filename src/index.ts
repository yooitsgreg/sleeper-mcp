#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerUserTools } from "./tools/users.js";
import { registerLeagueTools } from "./tools/leagues.js";
import { registerDraftTools } from "./tools/drafts.js";
import { registerPlayerTools } from "./tools/players.js";
import { registerStateTools } from "./tools/state.js";

const server = new McpServer({
  name: "sleeper-mcp",
  version: "1.0.0"
});

registerUserTools(server);
registerLeagueTools(server);
registerDraftTools(server);
registerPlayerTools(server);
registerStateTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
