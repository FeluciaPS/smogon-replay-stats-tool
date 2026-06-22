import { getPlayerTeam, getSmogonName } from "./storage.js";
import type { ParsedReplay, ReplayData, ReplayGroup, TournamentConfig, UsageEntry } from "./types";
import { toID } from "./utils.js";

export function extractReplayId(url: string): string | null {
    const match = url.match(/replay\.pokemonshowdown\.com\/([a-zA-Z0-9-]+)/);
    return match && match[1] ? match[1] : null;
}

const threadCache = new Map<string, Promise<string[]>>();

async function fetchAllReplaysFromThread(baseUrl: string): Promise<string[]> {
    let cleanUrl = baseUrl.replace(/\/page-\d+/, "");
    cleanUrl = cleanUrl.replace(/#.+/, "");
    if (!cleanUrl.endsWith('/')) cleanUrl += '/';

    if (threadCache.has(cleanUrl)) return threadCache.get(cleanUrl)!;

    const promise = (async () => {
        const allReplays: string[] = [];
        let page = 1;
        let lastFirstPostID = "";

        while (true) {
            const res = await fetch(`${cleanUrl}page-${page}`);
            const html = await res.text();

            const doc = new DOMParser().parseFromString(html, "text/html");
            const firstPostID = doc.querySelector("article")!.attributes.getNamedItem('id')!.value;

            if (firstPostID === lastFirstPostID) break;
            lastFirstPostID = firstPostID;

            const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>("a[href*='replay.pokemonshowdown.com']"));
            allReplays.push(...links.map(a => a.href));

            page++;
        }

        return allReplays;
    })();

    threadCache.set(cleanUrl, promise);
    return promise;
}

export async function loadReplays(urls: string[], isPreload: boolean = false): Promise<ReplayData[]> {
    if (!urls[0]) return [];

    if (isSmogon(urls[0])) {
        if (urls.length > 1) throw new Error("One smogon URL at a time please...");

        urls = await fetchAllReplaysFromThread(urls[0]);
    }

    const container = document.getElementById("progress_bar_container")!;
    const progressBar = document.getElementById("progress") as HTMLProgressElement;
    const progressText = document.getElementById("progress_text")!;

    if (!isPreload) container.hidden = false;
    progressBar.value = 0;
    progressText.textContent = `Loading replays... 0%`;

    const replays: ReplayData[] = [];
    try {
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i]!;
            const replayData = await fetchReplay(url);
    
            const percent = ((i + 1) / urls.length) * 100;
    
            progressBar.value = percent;
            progressText.textContent = `Loading replays... ${Math.round(percent)}%`;
    
            replays.push(replayData);
        }

        container.hidden = true;
    }
    catch (e) {
        progressBar.textContent = `Error loading replays...`;
    }

    return replays;
}

function isSmogon(url: string): boolean {
    return /smogon\.com\/forums\/threads\//.test(url);
}

const replayFetchCache = new Map<string, Promise<ReplayData>>();

export async function fetchReplay(url: string): Promise<ReplayData> {
    const id = extractReplayId(url);
    if (!id) throw new Error(`Invalid replay URL: ${url}`);

    if (replayFetchCache.has(id)) return replayFetchCache.get(id)!;

    console.log(`Fetching replay: ${id}`);
    const promise = fetch(`https://replay.pokemonshowdown.com/${id}.json`)
        .then(res => {
            console.log(res.status);
            if (!res.ok) throw new Error(`Failed to fetch replay ${id}: ${res.status}`);
            return res.json() as Promise<ReplayData>;
        })
        .catch(err => {
            replayFetchCache.delete(id);
            throw err;
        });

    replayFetchCache.set(id, promise);
    return promise;
}

export async function groupReplays(replays: ParsedReplay[], config: TournamentConfig): Promise<ReplayGroup[]> {
    const groups = new Map<string, ReplayGroup>();

    for (const replay of replays) {
        const names = [replay.playerNames.p1, replay.playerNames.p2].sort();
        const key = `${names[0]}|${names[1]}|${replay.format}`;

        if (!groups.has(key)) {
            const [a, b] = [replay.playerNames.p1, replay.playerNames.p2]
            const p1Smogon = getSmogonName(a);
            const p2Smogon = getSmogonName(b);
            groups.set(key, {
                p1: { ps: a, smogon: p1Smogon, team: getPlayerTeam(p1Smogon, config.teams) },
                p2: { ps: b, smogon: p2Smogon, team: getPlayerTeam(p2Smogon, config.teams) },
                firstPlayer: "p1",
                winner: "p1",
                format: replay.format,
                replays: []
            });
        }

        groups.get(key)!.replays.push(replay);
    }

    for (const [key, group] of groups) {
        const p1name = group.replays[0]?.playerNames.p1!;
        const wins = {
            p1: 0,
            p2: 0
        }

        for (const replay of group.replays) {
            if (!replay.winner) continue;

            if (replay.playerNames.p1 !== p1name) wins[replay.winner]--;
            else wins[replay.winner]++;
        }

        // It is possible for a group to have no distinguishable winner, this happens
        // when a game is voided due to a tie (in cases of infinite battles)
        if (wins.p1 > wins.p2) group.winner = "p1";
        if (wins.p2 > wins.p1) group.winner = "p2";
        if (wins.p1 === wins.p2) throw new Error("It shouldn't be possible for both players to win the same amount of games in a boX.");

        groups.set(key, group);
    }
    return Array.from(groups.values());
}

export async function parseReplays(replays: ReplayData[]): Promise<ParsedReplay[]> {
    const replayData: ParsedReplay[] = []
    for (const replay of replays) {
        replayData.push(parseReplay(replay));
    }

    return replayData
}

const deepcopy = (obj: any) => JSON.parse(JSON.stringify(obj));
const replayCache = new Map<string, ParsedReplay>();

export function parseReplay(replayData: ReplayData): ParsedReplay {
    const { id, log, format } = replayData;
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
            if (started) continue;
            const num = rest[0] as "p1" | "p2";

            // Ignore any additional player changes if the name is already set
            if (names[num]) continue;

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

    //if (!started) throw new Error(`Battle ${replayData.id} never started, was it forfeited on preview...?`);

    const data: ParsedReplay = {
        id,
        format,
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