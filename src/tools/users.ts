import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sleeperGet, handleApiError } from "../services/sleeperClient.js";
import { SleeperUser } from "../types.js";

export function registerUserTools(server: McpServer): void {
  server.registerTool(
    "sleeper_get_user",
    {
      title: "Get Sleeper User",
      description: `Retrieve a Sleeper user's profile by their username or user ID.

Args:
  - identifier (string): The username (e.g. "john_doe") or numeric user ID (e.g. "12345678")

Returns:
  User profile including user_id, username, display_name, and avatar.

Examples:
  - "Get user info for username 'sleeperuser'"
  - "Look up user ID 123456789"`,
      inputSchema: z.object({
        identifier: z.string()
          .min(1, "Identifier is required")
          .describe("Sleeper username or numeric user ID")
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ identifier }) => {
      try {
        const user = await sleeperGet<SleeperUser>(`/user/${identifier}`);
        const lines = [
          `# Sleeper User: ${user.display_name}`,
          "",
          `- **User ID**: ${user.user_id}`,
          `- **Username**: ${user.username}`,
          `- **Display Name**: ${user.display_name}`,
          `- **Avatar ID**: ${user.avatar ?? "none"}`,
        ];
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
