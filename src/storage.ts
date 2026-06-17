import type { PlayerTeam, TournamentConfig, UsernameStorage, UserTeamStorage } from "./types/index.ts";
import { toID } from "./utils.js";

const NAME_STORAGE_KEY = "1v1_replay_tool_name_map";
const CONFIG_STORAGE_KEY = "1v1_replay_tool_config";
const TEAM_STORAGE_KEY = "1v1_replay_tool_team_map";

export function loadConfig(): TournamentConfig {
    const emptyConfig: TournamentConfig = {
        teams: [],
        tiers: []
    }

    try {
        const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as TournamentConfig) : emptyConfig;
    } catch {
        return emptyConfig;
    }
}

export function saveConfig(config: TournamentConfig): void {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function loadTeamMap(): UserTeamStorage {
    try {
        const raw = localStorage.getItem(TEAM_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as UserTeamStorage) : {};
    } catch {
        return {};
    }
}

export function saveTeamMap(map: UserTeamStorage): void {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(map));
}

export function getPlayerTeam(smogonName: string | null, teams: PlayerTeam[]): PlayerTeam | null {
    if (!smogonName) return null;

    const map = loadTeamMap();
    const teamName = map[smogonName];
    if (!teamName) return null;

    for (const team of teams) {
        if (team.name === teamName) return team;
    }

    return null;
}

export function setPlayerTeam(smogonName: string, teamName: string) {
    const map = loadTeamMap();
    map[smogonName] = teamName;
    saveTeamMap(map);
}

export function loadUsernameMap(): UsernameStorage {
    try {
        const raw = localStorage.getItem(NAME_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as UsernameStorage) : {};
    } catch {
        return {};
    }
}

export function saveUsernameMap(map: UsernameStorage): void {
    localStorage.setItem(NAME_STORAGE_KEY, JSON.stringify(map));
}

export function setAlias(psName: string, smogonName: string): void {
    const map = loadUsernameMap();
    map[toID(psName)] = smogonName;
    saveUsernameMap(map);
}

export function getSmogonName(psName: string): string | null {
    const map = loadUsernameMap();
    return map[toID(psName)] ?? null;
}