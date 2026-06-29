# sleeper-mcp

An MCP (Model Context Protocol) server for the [Sleeper](https://sleeper.com) Fantasy Sports API. Gives Claude, Cursor, VS Code Copilot, and any other MCP-compatible AI client read access to Sleeper's public API — no API key required.

## What you can do

Ask your AI assistant things like:

- *"What leagues am I in this season?"* (give it your Sleeper username)
- *"Show me the standings and rosters for my league"*
- *"Who won the championship bracket?"*
- *"What trades happened this week?"*
- *"Which players are being added the most right now?"*
- *"Show me all first-round draft picks from my 2024 draft"*

## Available Tools

| Tool | Description |
|------|-------------|
| `sleeper_get_user` | Look up a user's profile by username or user ID |
| `sleeper_get_nfl_state` | Current NFL week, season type, and season year |
| `sleeper_get_user_leagues` | All leagues a user is in for a given sport/season |
| `sleeper_get_league` | Full league details including scoring and roster settings |
| `sleeper_get_league_rosters` | All rosters with win/loss records and player lists |
| `sleeper_get_league_users` | All managers in a league with their team names |
| `sleeper_get_league_matchups` | Weekly matchup scores for any week |
| `sleeper_get_league_winners_bracket` | Playoff championship bracket |
| `sleeper_get_league_losers_bracket` | Consolation / toilet bowl bracket |
| `sleeper_get_league_transactions` | Trades, waiver claims, and FA adds/drops by week |
| `sleeper_get_league_traded_picks` | All traded draft picks in a league |
| `sleeper_get_user_drafts` | All drafts a user participated in |
| `sleeper_get_league_drafts` | All drafts for a league |
| `sleeper_get_draft` | Full draft details (type, order, slot mapping) |
| `sleeper_get_draft_picks` | Every pick in a draft with player and position info |
| `sleeper_get_draft_traded_picks` | Picks that were traded within a draft |
| `sleeper_get_nfl_players` | Full NFL player database with filtering by position, team, or name |
| `sleeper_get_trending_players` | Most-added or most-dropped players over a time window |

## Prerequisites

- **Node.js 18+** — [download](https://nodejs.org) — OR — **Bun** — [download](https://bun.sh)
- A Sleeper account is helpful but not required (the API is fully public)

## Installation

```bash
git clone https://github.com/yooitsgreg/sleeper-mcp.git
cd sleeper-mcp

# pick your package manager:
npm install   # or: pnpm install / yarn / bun install
```

The install triggers a `prepare` hook that compiles TypeScript to `dist/`. No separate build step needed.

## Configuration

Pick the section for your AI client.

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "sleeper": {
      "command": "node",
      "args": ["/absolute/path/to/sleeper-mcp/dist/index.js"]
    }
  }
}
```

### Claude Code (CLI)

Edit `~/.claude/claude.json`:

```json
{
  "mcpServers": {
    "sleeper": {
      "command": "node",
      "args": ["/absolute/path/to/sleeper-mcp/dist/index.js"]
    }
  }
}
```

### VS Code (GitHub Copilot / MCP extension)

Create or edit `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "sleeper": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/sleeper-mcp/dist/index.js"]
    }
  }
}
```

### Cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "sleeper": {
      "command": "node",
      "args": ["/absolute/path/to/sleeper-mcp/dist/index.js"]
    }
  }
}
```

After editing the config, restart your AI client.

## Development

```bash
npm run dev     # watch mode (tsx), recompiles on save
npm run build   # compile TypeScript → dist/
npm run clean   # remove dist/
```

### Project structure

```
src/
├── index.ts              # Entry point — wires up McpServer + StdioServerTransport
├── constants.ts          # API base URL, timeouts, character limits
├── types.ts              # TypeScript interfaces for all Sleeper API responses
├── services/
│   └── sleeperClient.ts  # Shared axios client and error handler
└── tools/
    ├── users.ts          # sleeper_get_user
    ├── leagues.ts        # All league tools (9 tools)
    ├── drafts.ts         # All draft tools (5 tools)
    ├── players.ts        # sleeper_get_nfl_players, sleeper_get_trending_players
    └── state.ts          # sleeper_get_nfl_state
```

## Notes

- **No authentication required** — Sleeper's API is free and public.
- **Rate limit** — Sleeper asks that you stay under 1,000 requests/minute.
- **`sleeper_get_nfl_players`** fetches ~5 MB of data. Use the `position_filter`, `team_filter`, or `search` parameters to keep responses manageable. Sleeper recommends caching this data and only refreshing once per day.
- All tools are read-only — this server never writes to Sleeper.

## License

MIT
