export interface TournamentConfig {
    teams: PlayerTeam[];
    tiers: string[];
}

export interface RenderContext {
    replayGroups: ReplayGroup[];
    config: TournamentConfig;
}

export interface ReplayEntry {
    url: string;
    round: string;
    p1Smogon: string;
    p2Smogon: string;
    winner: string;
}

export interface ReplayData {
    id: string;
    format: string;
    players: [string, string];
    log: string;
    uploadtime: number;
    formatid: string;
}

export interface ParsedReplay {
    id: string;
    format: string;
    playerNames: { p1: string; p2: string };
    winner: "p1" | "p2" | null;
    winnerName: string | null;
    teams: { p1: string[], p2: string[] };
    clicked: { p1: string, p2: string };
}

export interface PlayerData {
    ps: string;
    smogon: string | null;
    team: PlayerTeam | null;
}

export interface ReplayGroup {
    p1: PlayerData;
    p2: PlayerData;
    winner: "p1" | "p2";
    firstPlayer: "p1" | "p2";
    format: string;
    replays: ParsedReplay[]
}

export interface PlayerTeam {
    name: string;
    mascot: string | null;
}

export interface TeamMatchup {
    teamA: { name: string; mascot: string | null};
    teamB: { name: string; mascot: string | null};
    groups: ReplayGroup[];
}

export interface UsageStat {
    name: string;
    brings: number;
    clicks: number;
    wins: number;
}

export interface UsageEntry {
    name: string;
    player: string;
    won: boolean;
}

// We store PS-smogon username links in localStorage 
// key: PS username
// value: Smogon username
export type UsernameStorage = Record<string, string>;
export type UserTeamStorage = Record<string, string>;