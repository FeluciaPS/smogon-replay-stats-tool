import type { ReplayData, UsageEntry } from "./types/index.js";
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

export function getTeams(log: string): { p1: string[]; p2: string[] } {
    const p1: string[] = [];
    const p2: string[] = [];
    
    for (const line of log.split("\n")) {
        let parts = line.split('|').slice(1);
        let type = parts.shift();

        // Break on battle start since we only care about team preview
        if (type === "start") break;
        if (type !== "poke") continue;

        let player = parts.shift() as "p1" | "p2";
        let pokemon = parts.shift()!.split(",")[0]!;

        (player === "p1" ? p1 : p2).push(pokemon);
    }

    return { p1, p2 };
}

// Parse which mons were actually sent out (not just brought to team preview)
export function parseClicked(log: string): { p1: string; p2: string } {
    let p1: string | undefined;
    let p2: string | undefined;
    let started = false;

    for (const line of log.split("\n")) {
        const parts = line.split("|").slice(1);
        const type = parts.shift();
        if (!started) {
            if (type === "start") started = true;
            continue;
        }
        
        if (type !== "switch") continue;

        const player = parts.shift()?.match(/p[12]/)?.[0];
        const species = parts.shift()?.split(',')[0];

        if (player === "p1") {
            if (p1) throw new Error("Multiple switch events found in a 1v1 replay");
            p1 = species;
        }

        if (player === "p2") {
            if (p2) throw new Error("Multiple switch events found in a 1v1 replay");
            p2 = species;
        }
    }

    if (!started) throw new Error("Battle never started, was it forfeited on preview...?");
    if (!p1 || !p2) throw new Error("No leads found in replay");

    return { p1, p2 };
}

export function getPlayerNames(log: string): {p1: string, p2: string} {
    const players = {
        p1: '',
        p2: ''
    }
    for (const line of log.split("\n")) {
        const parts = line.split("|").slice(1);
        const type = parts.shift();

        if (type === "player") {
            const num = parts[0] as "p1" | "p2";
            const name = toID(parts[1] ?? '');
            players[num] = name;
        }
    }

    return players;
}

export function getWinningPlayer(log: string): "p1" | "p2" | null {
    const players = getPlayerNames(log);

    for (const line of log.split("\n")) {
        const parts = line.split("|").slice(1);
        const type = parts.shift();

        if (type !== "win") continue;
        const playerName = toID(parts[0] ?? '');

        if (players.p1 === playerName) return "p1";
        if (players.p2 === playerName) return "p2";
    }

    return null;
}

export function buildUsageData(log: string): { usage: UsageEntry[], clickedUsage: UsageEntry[] } {
    const clicked = parseClicked(log);
    const teams = getTeams(log);
    const names = getPlayerNames(log);
    const winner = getWinningPlayer(log);

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