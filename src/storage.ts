import type { UsernameStorage } from "./types/index.ts";
import { toID } from "./utils.js";

const STORAGE_KEY = "1v1_replay_tool_name_map";

export function loadUsernameMap(): UsernameStorage {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as UsernameStorage) : {};
    } catch {
        return {};
    }
}

export function saveUsernameMap(map: UsernameStorage): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
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