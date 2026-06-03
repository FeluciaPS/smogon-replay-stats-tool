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