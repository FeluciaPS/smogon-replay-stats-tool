import { toID } from "./utils.js";
const NAME_STORAGE_KEY = "1v1_replay_tool_name_map";
const CONFIG_STORAGE_KEY = "1v1_replay_tool_config";
const TEAM_STORAGE_KEY = "1v1_replay_tool_team_map";
export function loadConfig() {
    const emptyConfig = {
        teams: [],
        tiers: []
    };
    try {
        const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
        return raw ? JSON.parse(raw) : emptyConfig;
    }
    catch {
        return emptyConfig;
    }
}
export function saveConfig(config) {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}
export function loadTeamMap() {
    try {
        const raw = localStorage.getItem(TEAM_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    }
    catch {
        return {};
    }
}
export function saveTeamMap(map) {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(map));
}
export function getPlayerTeam(smogonName, teams) {
    if (!smogonName)
        return null;
    const map = loadTeamMap();
    const teamName = map[smogonName];
    if (!teamName)
        return null;
    for (const team of teams) {
        if (team.name === teamName)
            return team;
    }
    return null;
}
export function setPlayerTeam(smogonName, teamName) {
    const map = loadTeamMap();
    map[smogonName] = teamName;
    saveTeamMap(map);
}
export function loadUsernameMap() {
    try {
        const raw = localStorage.getItem(NAME_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    }
    catch {
        return {};
    }
}
export function saveUsernameMap(map) {
    localStorage.setItem(NAME_STORAGE_KEY, JSON.stringify(map));
}
export function setAlias(psName, smogonName) {
    const map = loadUsernameMap();
    map[toID(psName)] = smogonName;
    saveUsernameMap(map);
}
export function getSmogonName(psName) {
    const map = loadUsernameMap();
    return map[toID(psName)] ?? null;
}
