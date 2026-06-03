import type { ParsedReplay, ReplayData, UsageEntry } from "./types/index.js";
import { toID } from "./utils.js";

export function extractReplayId(url: string): string | null {
    const match = url.match(/replay\.pokemonshowdown\.com\/([a-zA-Z0-9-]+)/);
    return match && match[1] ? match[1] : null;
}

export async function fetchReplay(url: string): Promise<ReplayData> {
    const id = extractReplayId(url);
    if (!id) throw new Error(`Invalid replay URL: ${url}`);

    const res = await fetch(`https://replay.pokemonshowdown.com/${id}.json`);
    if (!res.ok) throw new Error(`Failed to fetch replay ${id}: ${res.status}`);

    return res.json() as Promise<ReplayData>;
}

const deepcopy = (obj: any) => JSON.parse(JSON.stringify(obj));
const replayCache = new Map<string, ParsedReplay>();

export function parseReplay(replayData: ReplayData): ParsedReplay {
    const { id, log } = replayData;
    if (replayCache.has(id)) return deepcopy(replayCache.get(id)!);

    const names = {
        p1: '',
        p2: ''
    }
    const teams: {p1: string[], p2: string[]} = {
        p1: [],
        p2: []
    }
    const clicked: { p1: string, p2: string } = {
        p1: '',
        p2: ''
    }
    let winner: "p1" | "p2" | null = null;
    let winnerName = null;

    let started = false;

    for (const line of log.split('\n')) {
        const [, type, ...rest] = line.split('|');

        if (type === "start") {
            started = true;
        }

        if (type === "player") {
            const num = rest[0] as "p1" | "p2";
            const name = toID(rest[1] ?? '');
            names[num] = name;
        }

        if (type === "win") {
            winnerName = toID(rest[0] ?? '');
            winner = winnerName == names.p1 ? "p1" : "p2";
        }

        if (type === "poke") {
            const player = rest[0] as "p1" | "p2";
            const pokemon = rest[1]!.split(",")[0]!;

            teams[player].push(pokemon);
        }

        if (type === "switch") {
            const player = rest[0]!.match(/p[12]/)?.[0] as "p1" | "p2";
            const pokemon = rest[1]!.split(',')[0]!;

            clicked[player] = pokemon;
        }
    }

    if (!started) throw new Error("Battle never started, was it forfeited on preview...?");

    const data: ParsedReplay = {
        id,
        playerNames: names,
        winner,
        winnerName,
        teams,
        clicked
    }

    replayCache.set(id, deepcopy(data));

    return data;
    
}

export function getTeams(data: ReplayData): { p1: string[]; p2: string[] } {
    return parseReplay(data).teams;
}

// Parse which mons were actually sent out (not just brought to team preview)
export function parseClicked(data: ReplayData): { p1: string; p2: string } {
    return parseReplay(data).clicked;
}

export function getPlayerNames(data: ReplayData): {p1: string, p2: string} {
    return parseReplay(data).playerNames;
}

export function getWinningPlayer(data: ReplayData): "p1" | "p2" | null {
    return parseReplay(data).winner;
}

export function buildUsageData(data: ReplayData): { usage: UsageEntry[], clickedUsage: UsageEntry[] } {
    const clicked = parseClicked(data);
    const teams = getTeams(data);
    const names = getPlayerNames(data);
    const winner = getWinningPlayer(data);

    const clickedUsage: UsageEntry[] = [
        {
            name: clicked.p1,
            player: names.p1,
            won: winner === "p1"
        },
        {
            name: clicked.p2,
            player: names.p2,
            won: winner === "p2"
        },
    ];


    const usage: UsageEntry[] = [];
    for (const mon of teams.p1) {
        usage.push({ name: mon, player: names.p1, won: winner === "p1" });
    }
    for (const mon of teams.p2) {
        usage.push({ name: mon, player: names.p2, won: winner === "p2" });
    }

    return {
        usage,
        clickedUsage
    };
}