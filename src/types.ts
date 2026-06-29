export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  metadata?: Record<string, unknown>;
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  season_type: string;
  sport: string;
  status: string;
  total_rosters: number;
  roster_positions: string[];
  settings: Record<string, unknown>;
  scoring_settings: Record<string, unknown>;
  avatar: string | null;
  draft_id: string;
  previous_league_id: string | null;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  league_id: string;
  players: string[] | null;
  starters: string[] | null;
  reserve: string[] | null;
  settings: {
    wins: number;
    losses: number;
    ties: number;
    fpts: number;
    fpts_decimal: number;
    fpts_against: number;
    fpts_against_decimal: number;
    waiver_position: number;
    waiver_budget_used: number;
    total_moves: number;
    streak?: number;
    record?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  points: number;
  custom_points: number | null;
  players: string[] | null;
  starters: string[] | null;
  players_points: Record<string, number> | null;
  starters_points: number[] | null;
}

export interface SleeperTransaction {
  transaction_id: string;
  type: "trade" | "waiver" | "free_agent";
  status: string;
  roster_ids: number[];
  adds: Record<string, number> | null;
  drops: Record<string, number> | null;
  draft_picks: SleeperTradedPick[];
  creator: string;
  created: number;
  status_updated: number;
  settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  waiver_budget: Record<string, unknown>[];
  leg: number;
}

export interface SleeperTradedPick {
  season: string;
  round: number;
  roster_id: number;
  previous_owner_id: number;
  owner_id: number;
}

export interface SleeperDraft {
  draft_id: string;
  type: string;
  status: string;
  sport: string;
  season: string;
  season_type: string;
  league_id: string;
  slot_to_roster_id: Record<string, number>;
  draft_order: Record<string, number> | null;
  picks_per_round?: number;
  rounds: number;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created: number;
  updated: number;
  start_time: number;
  last_picked: number;
  last_message_id: string;
  last_message_time: number;
}

export interface SleeperDraftPick {
  round: number;
  roster_id: number;
  player_id: string;
  picked_by: string;
  pick_no: number;
  metadata: {
    team: string;
    status: string;
    sport: string;
    position: string;
    player_id: string;
    number: string;
    news_updated: string;
    last_name: string;
    injury_status: string;
    first_name: string;
  };
  is_keeper: boolean | null;
  draft_slot: number;
  draft_id: string;
}

export interface SleeperPlayer {
  player_id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  position: string;
  team: string | null;
  status: string;
  age: number | null;
  years_exp: number | null;
  number: number | null;
  depth_chart_position: string | null;
  depth_chart_order: number | null;
  injury_status: string | null;
  fantasy_positions: string[] | null;
  sport: string;
  active: boolean;
}

export interface SleeperTrendingPlayer {
  player_id: string;
  count: number;
}

export interface SleeperNFLState {
  week: number;
  season_type: string;
  season_start_date: string;
  season: string;
  previous_season: string;
  leg: number;
  league_season: string;
  league_create_season: string;
  display_week: number;
}

export interface BracketMatchup {
  r: number;
  m: number;
  t1?: number;
  t2?: number;
  w?: number;
  l?: number;
  t1_from?: { w?: number; l?: number };
  t2_from?: { w?: number; l?: number };
  p?: number;
}
