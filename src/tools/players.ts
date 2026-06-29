import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sleeperGet, handleApiError } from "../services/sleeperClient.js";
import { SleeperPlayer, SleeperTrendingPlayer } from "../types.js";
import { CHARACTER_LIMIT } from "../constants.js";

export function registerPlayerTools(server: McpServer): void {
  server.registerTool(
    "sleeper_get_nfl_players",
    {
      title: "Get All NFL Players",
      description: `Fetch the complete NFL player database from Sleeper (~5MB). Returns all player metadata.
NOTE: This is a large dataset. Use filters to narrow results. Sleeper recommends caching this data and only fetching once per day.

Args:
  - position_filter (string, optional): Filter by position (e.g. "QB", "RB", "WR", "TE", "K", "DEF")
  - team_filter (string, optional): Filter by NFL team abbreviation (e.g. "KC", "SF", "DAL")
  - active_only (boolean): Only return active players (default: true)
  - search (string, optional): Filter by player name (case-insensitive substring match)
  - limit (number): Max players to return (default: 50, max: 200)
  - offset (number): Pagination offset (default: 0)

Returns:
  Paginated list of players with id, name, position, team, status.

Examples:
  - "List all active QBs"
  - "Find players on the Kansas City Chiefs"
  - "Search for players named 'Patrick'"`,
      inputSchema: z.object({
        position_filter: z.string().optional().describe("Filter by position: QB, RB, WR, TE, K, DEF, etc."),
        team_filter: z.string().optional().describe("Filter by NFL team abbreviation (e.g. KC, SF, DAL)"),
        active_only: z.boolean().default(true).describe("Only return active players"),
        search: z.string().optional().describe("Case-insensitive substring match on player name"),
        limit: z.number().int().min(1).max(200).default(50).describe("Max players to return"),
        offset: z.number().int().min(0).default(0).describe("Pagination offset")
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ position_filter, team_filter, active_only, search, limit, offset }) => {
      try {
        const allPlayers = await sleeperGet<Record<string, SleeperPlayer>>("/players/nfl");
        let players = Object.values(allPlayers);

        if (active_only) {
          players = players.filter(p => p.active);
        }
        if (position_filter) {
          const pos = position_filter.toUpperCase();
          players = players.filter(p => p.position === pos || (p.fantasy_positions ?? []).includes(pos));
        }
        if (team_filter) {
          const team = team_filter.toUpperCase();
          players = players.filter(p => p.team === team);
        }
        if (search) {
          const q = search.toLowerCase();
          players = players.filter(p =>
            (p.full_name ?? `${p.first_name} ${p.last_name}`).toLowerCase().includes(q)
          );
        }

        const total = players.length;
        const paginated = players.slice(offset, offset + limit);
        const has_more = total > offset + paginated.length;

        const lines = [
          `# NFL Players (${total} total, showing ${paginated.length})`,
          ""
        ];
        for (const p of paginated) {
          const name = p.full_name ?? `${p.first_name} ${p.last_name}`;
          lines.push(`- **${name}** (${p.player_id}) — ${p.position ?? "N/A"} | ${p.team ?? "FA"} | ${p.status ?? "unknown"}`);
        }
        if (has_more) {
          lines.push("", `*Use offset=${offset + limit} to see more results.*`);
        }

        let text = lines.join("\n");
        if (text.length > CHARACTER_LIMIT) {
          text = text.slice(0, CHARACTER_LIMIT) + "\n\n*[Response truncated. Use filters or pagination to narrow results.]*";
        }

        return { content: [{ type: "text", text }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "sleeper_get_trending_players",
    {
      title: "Get Trending NFL Players",
      description: `Get trending NFL players on Sleeper based on recent add or drop activity.

Args:
  - type (string): "add" for most added players, "drop" for most dropped players
  - lookback_hours (number): Hours to look back for trend data (default: 24, max: 168)
  - limit (number): Number of trending players to return (default: 25, max: 200)

Returns:
  List of player IDs with their add/drop counts, sorted by activity volume.

Examples:
  - "Who are the most added players this week?"
  - "Which players are being dropped the most today?"
  - "Show me trending adds over the last 48 hours"`,
      inputSchema: z.object({
        type: z.enum(["add", "drop"]).describe("Trending type: 'add' or 'drop'"),
        lookback_hours: z.number().int().min(1).max(168).default(24).describe("Hours to look back (default: 24)"),
        limit: z.number().int().min(1).max(200).default(25).describe("Number of results to return (default: 25)")
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ type, lookback_hours, limit }) => {
      try {
        const trending = await sleeperGet<SleeperTrendingPlayer[]>(
          `/players/nfl/trending/${type}`,
          { lookback_hours, limit }
        );

        if (!trending.length) {
          return { content: [{ type: "text", text: `No trending ${type}s found for the last ${lookback_hours} hours.` }] };
        }

        const lines = [
          `# Trending ${type === "add" ? "Adds" : "Drops"} (last ${lookback_hours}h)`,
          ""
        ];
        trending.forEach((p, i) => {
          lines.push(`${i + 1}. Player ID: **${p.player_id}** — ${p.count} ${type}s`);
        });
        lines.push("", "*Use sleeper_get_nfl_players with a player name search to get full player details.*");

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
