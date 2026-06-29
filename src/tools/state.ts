import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sleeperGet, handleApiError } from "../services/sleeperClient.js";
import { SleeperNFLState } from "../types.js";

export function registerStateTools(server: McpServer): void {
  server.registerTool(
    "sleeper_get_nfl_state",
    {
      title: "Get NFL State",
      description: `Retrieve the current NFL season state including the active week, season type, and season dates.
Useful for knowing what week it is, whether we're in preseason/regular/postseason, and which season year is active.

Returns:
  Current week, season type (pre/regular/post), season year, season start date, display week.

Examples:
  - "What week is it in the NFL?"
  - "Is the NFL season currently active?"
  - "What is the current NFL season year?"`,
      inputSchema: z.object({}).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async () => {
      try {
        const state = await sleeperGet<SleeperNFLState>("/state/nfl");
        const lines = [
          `# NFL Current State`,
          "",
          `- **Season**: ${state.season}`,
          `- **Season Type**: ${state.season_type}`,
          `- **Current Week**: ${state.week}`,
          `- **Display Week**: ${state.display_week}`,
          `- **Season Start Date**: ${state.season_start_date}`,
          `- **Previous Season**: ${state.previous_season}`,
          `- **League Season**: ${state.league_season}`,
          `- **League Create Season**: ${state.league_create_season}`,
        ];
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
