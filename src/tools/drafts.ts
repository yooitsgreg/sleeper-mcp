import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sleeperGet, handleApiError } from "../services/sleeperClient.js";
import { SleeperDraft, SleeperDraftPick, SleeperTradedPick } from "../types.js";

export function registerDraftTools(server: McpServer): void {
  server.registerTool(
    "sleeper_get_user_drafts",
    {
      title: "Get User's Drafts",
      description: `Get all drafts a user has participated in for a given sport and season.

Args:
  - user_id (string): Sleeper user ID
  - sport (string): Sport (default: "nfl")
  - season (string): Season year (e.g. "2024")

Returns:
  List of drafts with draft ID, type, status, and league ID.

Examples:
  - "What drafts did user 123456 do in 2024?"
  - "Show all NFL drafts for this user"`,
      inputSchema: z.object({
        user_id: z.string().min(1).describe("Sleeper user ID"),
        sport: z.string().default("nfl").describe("Sport (default: nfl)"),
        season: z.string().min(4).max(4).describe("Season year, e.g. '2024'")
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ user_id, sport, season }) => {
      try {
        const drafts = await sleeperGet<SleeperDraft[]>(`/user/${user_id}/drafts/${sport}/${season}`);

        if (!drafts?.length) {
          return { content: [{ type: "text", text: `No drafts found for user ${user_id} in ${sport} ${season}.` }] };
        }

        const lines = [`# Drafts for User ${user_id} — ${sport.toUpperCase()} ${season}`, ""];
        for (const d of drafts) {
          const startTime = d.start_time ? new Date(d.start_time).toLocaleString() : "Not started";
          lines.push(`## Draft ${d.draft_id}`);
          lines.push(`- **Type**: ${d.type}`);
          lines.push(`- **Status**: ${d.status}`);
          lines.push(`- **League ID**: ${d.league_id}`);
          lines.push(`- **Rounds**: ${d.rounds}`);
          lines.push(`- **Start Time**: ${startTime}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "sleeper_get_league_drafts",
    {
      title: "Get League Drafts",
      description: `Get all drafts that have taken place in a Sleeper fantasy league.

Args:
  - league_id (string): The Sleeper league ID

Returns:
  All drafts for the league with type, status, rounds, and timing.

Examples:
  - "What drafts have happened in league 123456?"
  - "Get the draft history for this league"`,
      inputSchema: z.object({
        league_id: z.string().min(1).describe("Sleeper league ID")
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ league_id }) => {
      try {
        const drafts = await sleeperGet<SleeperDraft[]>(`/league/${league_id}/drafts`);

        if (!drafts?.length) {
          return { content: [{ type: "text", text: `No drafts found for league ${league_id}.` }] };
        }

        const lines = [`# Drafts for League ${league_id}`, ""];
        for (const d of drafts) {
          const startTime = d.start_time ? new Date(d.start_time).toLocaleString() : "Not started";
          lines.push(`## Draft ${d.draft_id}`);
          lines.push(`- **Type**: ${d.type}`);
          lines.push(`- **Status**: ${d.status}`);
          lines.push(`- **Season**: ${d.season} (${d.season_type})`);
          lines.push(`- **Rounds**: ${d.rounds}`);
          lines.push(`- **Start Time**: ${startTime}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "sleeper_get_draft",
    {
      title: "Get Draft Details",
      description: `Get detailed information about a specific Sleeper fantasy draft.

Args:
  - draft_id (string): The Sleeper draft ID

Returns:
  Full draft details: type, status, rounds, slot-to-roster mapping, draft order, settings.

Examples:
  - "Show details for draft 987654321"
  - "What type of draft is this and how many rounds?"`,
      inputSchema: z.object({
        draft_id: z.string().min(1).describe("Sleeper draft ID")
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ draft_id }) => {
      try {
        const draft = await sleeperGet<SleeperDraft>(`/draft/${draft_id}`);
        const startTime = draft.start_time ? new Date(draft.start_time).toLocaleString() : "Not started";
        const lines = [
          `# Draft ${draft.draft_id}`,
          "",
          `- **Type**: ${draft.type}`,
          `- **Status**: ${draft.status}`,
          `- **League ID**: ${draft.league_id}`,
          `- **Season**: ${draft.season} (${draft.season_type})`,
          `- **Sport**: ${draft.sport}`,
          `- **Rounds**: ${draft.rounds}`,
          `- **Start Time**: ${startTime}`,
          "",
          "## Draft Order",
          "```json",
          JSON.stringify(draft.draft_order, null, 2),
          "```",
          "",
          "## Slot to Roster Mapping",
          "```json",
          JSON.stringify(draft.slot_to_roster_id, null, 2),
          "```"
        ];
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "sleeper_get_draft_picks",
    {
      title: "Get Draft Picks",
      description: `Get all picks made in a specific Sleeper fantasy draft, in order.

Args:
  - draft_id (string): The Sleeper draft ID
  - round_filter (number, optional): Filter results to a specific round only

Returns:
  All picks in pick order: round, pick number, player, position, team, and who picked them.

Examples:
  - "Show all picks from draft 987654321"
  - "What were the first-round picks?"
  - "Who did roster 5 draft?"`,
      inputSchema: z.object({
        draft_id: z.string().min(1).describe("Sleeper draft ID"),
        round_filter: z.number().int().min(1).optional().describe("Optional: only return picks from this round")
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ draft_id, round_filter }) => {
      try {
        let picks = await sleeperGet<SleeperDraftPick[]>(`/draft/${draft_id}/picks`);

        if (!picks?.length) {
          return { content: [{ type: "text", text: `No picks found for draft ${draft_id}.` }] };
        }

        if (round_filter !== undefined) {
          picks = picks.filter(p => p.round === round_filter);
        }

        const lines = [`# Draft Picks — Draft ${draft_id}${round_filter ? ` (Round ${round_filter})` : ""}`, ""];
        for (const p of picks) {
          const name = `${p.metadata?.first_name ?? ""} ${p.metadata?.last_name ?? ""}`.trim() || p.player_id;
          const pos = p.metadata?.position ?? "?";
          const team = p.metadata?.team ?? "FA";
          lines.push(`${p.pick_no}. (Rd ${p.round}) **${name}** — ${pos} | ${team} (Picked by Roster ${p.roster_id})`);
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "sleeper_get_draft_traded_picks",
    {
      title: "Get Draft Traded Picks",
      description: `Get all picks that were traded within a specific Sleeper draft.

Args:
  - draft_id (string): The Sleeper draft ID

Returns:
  All traded picks: round, original owner roster, and current owner roster.

Examples:
  - "What picks were traded in draft 987654321?"
  - "Show pick trades from this draft"`,
      inputSchema: z.object({
        draft_id: z.string().min(1).describe("Sleeper draft ID")
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ draft_id }) => {
      try {
        const picks = await sleeperGet<SleeperTradedPick[]>(`/draft/${draft_id}/traded_picks`);

        if (!picks?.length) {
          return { content: [{ type: "text", text: `No traded picks found in draft ${draft_id}.` }] };
        }

        const lines = [`# Traded Picks — Draft ${draft_id}`, ""];
        for (const p of picks) {
          lines.push(`- **Round ${p.round}** — Original Owner: Roster ${p.previous_owner_id} → Current Owner: Roster ${p.owner_id}`);
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
