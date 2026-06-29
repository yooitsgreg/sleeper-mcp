import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sleeperGet, handleApiError } from "../services/sleeperClient.js";
import {
  SleeperLeague,
  SleeperRoster,
  SleeperUser,
  SleeperMatchup,
  SleeperTransaction,
  SleeperTradedPick,
  BracketMatchup
} from "../types.js";

export function registerLeagueTools(server: McpServer): void {
  server.registerTool(
    "sleeper_get_user_leagues",
    {
      title: "Get User's Leagues",
      description: `Get all fantasy leagues a user is in for a given sport and season.

Args:
  - user_id (string): The Sleeper user ID (use sleeper_get_user to look up by username)
  - sport (string): Sport to filter by (default: "nfl")
  - season (string): Season year (e.g. "2024", "2025")

Returns:
  List of leagues including league name, ID, status, roster count, and scoring type.

Examples:
  - "What leagues is user 123456 in for the 2024 season?"
  - "Show all NFL leagues for user ID 987654321"`,
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
        const leagues = await sleeperGet<SleeperLeague[]>(`/user/${user_id}/leagues/${sport}/${season}`);

        if (!leagues?.length) {
          return { content: [{ type: "text", text: `No leagues found for user ${user_id} in ${sport} ${season}.` }] };
        }

        const lines = [`# Leagues for User ${user_id} — ${sport.toUpperCase()} ${season}`, ""];
        for (const l of leagues) {
          lines.push(`## ${l.name} (${l.league_id})`);
          lines.push(`- **Status**: ${l.status}`);
          lines.push(`- **Teams**: ${l.total_rosters}`);
          lines.push(`- **Season Type**: ${l.season_type}`);
          lines.push(`- **Draft ID**: ${l.draft_id}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "sleeper_get_league",
    {
      title: "Get League Details",
      description: `Fetch detailed information about a specific Sleeper fantasy league.

Args:
  - league_id (string): The Sleeper league ID

Returns:
  Full league details: name, status, settings, scoring settings, roster positions, and more.

Examples:
  - "Get details for league 123456789"
  - "What are the scoring settings for this league?"`,
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
        const league = await sleeperGet<SleeperLeague>(`/league/${league_id}`);
        const lines = [
          `# League: ${league.name}`,
          "",
          `- **League ID**: ${league.league_id}`,
          `- **Status**: ${league.status}`,
          `- **Season**: ${league.season} (${league.season_type})`,
          `- **Sport**: ${league.sport}`,
          `- **Teams**: ${league.total_rosters}`,
          `- **Draft ID**: ${league.draft_id}`,
          `- **Roster Positions**: ${league.roster_positions?.join(", ") ?? "N/A"}`,
          "",
          "## Scoring Settings",
          "```json",
          JSON.stringify(league.scoring_settings, null, 2),
          "```",
          "",
          "## League Settings",
          "```json",
          JSON.stringify(league.settings, null, 2),
          "```"
        ];
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "sleeper_get_league_rosters",
    {
      title: "Get League Rosters",
      description: `Get all rosters in a Sleeper fantasy league, including players, starters, and standings.

Args:
  - league_id (string): The Sleeper league ID

Returns:
  All rosters with owner IDs, player lists, and win/loss records.

Examples:
  - "Show me all rosters in league 123456"
  - "What players does roster 3 have?"`,
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
        const rosters = await sleeperGet<SleeperRoster[]>(`/league/${league_id}/rosters`);

        if (!rosters?.length) {
          return { content: [{ type: "text", text: `No rosters found for league ${league_id}.` }] };
        }

        const lines = [`# Rosters for League ${league_id}`, ""];
        for (const r of rosters) {
          const s = r.settings;
          const record = `${s.wins ?? 0}-${s.losses ?? 0}-${s.ties ?? 0}`;
          lines.push(`## Roster #${r.roster_id} (Owner: ${r.owner_id})`);
          lines.push(`- **Record**: ${record}`);
          lines.push(`- **Points For**: ${((s.fpts ?? 0) + (s.fpts_decimal ?? 0) / 100).toFixed(2)}`);
          lines.push(`- **Points Against**: ${((s.fpts_against ?? 0) + (s.fpts_against_decimal ?? 0) / 100).toFixed(2)}`);
          lines.push(`- **Players**: ${r.players?.join(", ") ?? "none"}`);
          lines.push(`- **Starters**: ${r.starters?.join(", ") ?? "none"}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "sleeper_get_league_users",
    {
      title: "Get League Users",
      description: `Get all users (managers) in a Sleeper fantasy league with their team names and metadata.

Args:
  - league_id (string): The Sleeper league ID

Returns:
  List of users with user IDs, display names, team names, and avatar IDs.

Examples:
  - "Who are the managers in league 123456?"
  - "List all teams in this league"`,
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
        const users = await sleeperGet<(SleeperUser & { metadata: { team_name?: string } })[]>(`/league/${league_id}/users`);

        if (!users?.length) {
          return { content: [{ type: "text", text: `No users found for league ${league_id}.` }] };
        }

        const lines = [`# Users in League ${league_id}`, ""];
        for (const u of users) {
          const teamName = u.metadata?.team_name ?? "(no team name)";
          lines.push(`- **${u.display_name}** (${u.user_id}) — Team: ${teamName}`);
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "sleeper_get_league_matchups",
    {
      title: "Get League Matchups",
      description: `Get all matchups for a specific week in a Sleeper fantasy league.

Args:
  - league_id (string): The Sleeper league ID
  - week (number): NFL week number (1-18 for regular season)

Returns:
  All matchups for the week: roster IDs, points, starters, and player scores.

Examples:
  - "What are the matchups for week 5 in league 123456?"
  - "Show me all scores for week 12"`,
      inputSchema: z.object({
        league_id: z.string().min(1).describe("Sleeper league ID"),
        week: z.number().int().min(1).max(18).describe("NFL week number (1-18)")
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ league_id, week }) => {
      try {
        const matchups = await sleeperGet<SleeperMatchup[]>(`/league/${league_id}/matchups/${week}`);

        if (!matchups?.length) {
          return { content: [{ type: "text", text: `No matchups found for league ${league_id} week ${week}.` }] };
        }

        // Group by matchup_id
        const grouped = new Map<number, SleeperMatchup[]>();
        for (const m of matchups) {
          const group = grouped.get(m.matchup_id) ?? [];
          group.push(m);
          grouped.set(m.matchup_id, group);
        }

        const lines = [`# Week ${week} Matchups — League ${league_id}`, ""];
        for (const [matchup_id, teams] of grouped.entries()) {
          lines.push(`## Matchup #${matchup_id}`);
          for (const t of teams) {
            lines.push(`- **Roster ${t.roster_id}**: ${t.points ?? 0} pts`);
            if (t.starters?.length) {
              lines.push(`  Starters: ${t.starters.join(", ")}`);
            }
          }
          lines.push("");
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "sleeper_get_league_winners_bracket",
    {
      title: "Get League Winners Bracket",
      description: `Get the playoff winners bracket (championship bracket) for a Sleeper fantasy league.

Args:
  - league_id (string): The Sleeper league ID

Returns:
  Bracket structure showing playoff matchups, rounds, and results.

Examples:
  - "Show me the playoff bracket for league 123456"
  - "Who won the championship in this league?"`,
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
        const bracket = await sleeperGet<BracketMatchup[]>(`/league/${league_id}/winners_bracket`);

        if (!bracket?.length) {
          return { content: [{ type: "text", text: `No winners bracket found for league ${league_id}. Playoffs may not have started.` }] };
        }

        const lines = [`# Winners Bracket — League ${league_id}`, ""];
        for (const m of bracket) {
          lines.push(`## Round ${m.r}, Match ${m.m}`);
          lines.push(`- **Team 1 (Roster)**: ${m.t1 ?? "TBD"}`);
          lines.push(`- **Team 2 (Roster)**: ${m.t2 ?? "TBD"}`);
          if (m.w !== undefined) lines.push(`- **Winner**: Roster ${m.w}`);
          if (m.l !== undefined) lines.push(`- **Loser**: Roster ${m.l}`);
          if (m.p !== undefined) lines.push(`- **Place**: ${m.p}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "sleeper_get_league_losers_bracket",
    {
      title: "Get League Losers Bracket",
      description: `Get the consolation/toilet bowl (losers bracket) for a Sleeper fantasy league.

Args:
  - league_id (string): The Sleeper league ID

Returns:
  Losers bracket structure showing consolation matchups and results.

Examples:
  - "Show me the toilet bowl bracket for league 123456"
  - "Who came in last place?"`,
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
        const bracket = await sleeperGet<BracketMatchup[]>(`/league/${league_id}/losers_bracket`);

        if (!bracket?.length) {
          return { content: [{ type: "text", text: `No losers bracket found for league ${league_id}.` }] };
        }

        const lines = [`# Losers Bracket — League ${league_id}`, ""];
        for (const m of bracket) {
          lines.push(`## Round ${m.r}, Match ${m.m}`);
          lines.push(`- **Team 1 (Roster)**: ${m.t1 ?? "TBD"}`);
          lines.push(`- **Team 2 (Roster)**: ${m.t2 ?? "TBD"}`);
          if (m.w !== undefined) lines.push(`- **Winner**: Roster ${m.w}`);
          if (m.l !== undefined) lines.push(`- **Loser**: Roster ${m.l}`);
          if (m.p !== undefined) lines.push(`- **Place**: ${m.p}`);
          lines.push("");
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "sleeper_get_league_transactions",
    {
      title: "Get League Transactions",
      description: `Get all transactions (trades, waiver claims, free agent adds/drops) for a specific round/week in a league.

Args:
  - league_id (string): The Sleeper league ID
  - round (number): The transaction round (corresponds to NFL week number)

Returns:
  List of transactions with type (trade/waiver/free_agent), adds, drops, traded picks, and status.

Examples:
  - "What trades happened in week 8 in league 123456?"
  - "Show all waiver claims for round 3"`,
      inputSchema: z.object({
        league_id: z.string().min(1).describe("Sleeper league ID"),
        round: z.number().int().min(1).describe("Transaction round (week number)")
      }).strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ league_id, round }) => {
      try {
        const transactions = await sleeperGet<SleeperTransaction[]>(`/league/${league_id}/transactions/${round}`);

        if (!transactions?.length) {
          return { content: [{ type: "text", text: `No transactions found for league ${league_id} round ${round}.` }] };
        }

        const lines = [`# Transactions — League ${league_id}, Round ${round}`, ""];
        for (const t of transactions) {
          const date = new Date(t.created).toLocaleDateString();
          lines.push(`## ${t.type.toUpperCase()} — ${t.status} (${date})`);
          lines.push(`- **ID**: ${t.transaction_id}`);
          lines.push(`- **Rosters Involved**: ${t.roster_ids.join(", ")}`);
          if (t.adds && Object.keys(t.adds).length) {
            lines.push(`- **Adds**: ${Object.entries(t.adds).map(([pid, rid]) => `Player ${pid} → Roster ${rid}`).join(", ")}`);
          }
          if (t.drops && Object.keys(t.drops).length) {
            lines.push(`- **Drops**: ${Object.entries(t.drops).map(([pid, rid]) => `Player ${pid} from Roster ${rid}`).join(", ")}`);
          }
          if (t.draft_picks?.length) {
            const picks = t.draft_picks.map(p => `${p.season} Round ${p.round} (${p.previous_owner_id} → ${p.owner_id})`).join(", ");
            lines.push(`- **Draft Picks**: ${picks}`);
          }
          lines.push("");
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );

  server.registerTool(
    "sleeper_get_league_traded_picks",
    {
      title: "Get League Traded Picks",
      description: `Get all traded draft picks in a Sleeper fantasy league (across all seasons).

Args:
  - league_id (string): The Sleeper league ID

Returns:
  All traded picks with season, round, original owner, and current owner.

Examples:
  - "What draft picks have been traded in league 123456?"
  - "Which future picks does roster 3 own?"`,
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
        const picks = await sleeperGet<SleeperTradedPick[]>(`/league/${league_id}/traded_picks`);

        if (!picks?.length) {
          return { content: [{ type: "text", text: `No traded picks found for league ${league_id}.` }] };
        }

        const lines = [`# Traded Picks — League ${league_id}`, ""];
        for (const p of picks) {
          lines.push(`- **${p.season} Round ${p.round}** — Original Owner: Roster ${p.previous_owner_id} → Current Owner: Roster ${p.owner_id}`);
        }

        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}
