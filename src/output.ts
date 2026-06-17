import { ParsedReplay, PlayerTeam, RenderContext, ReplayGroup, TeamMatchup } from "./types/index.js";

const PROJECT_URL = 'https://feluciaps.github.io/smogon-replay-stats-tool/';
export function generateBBCode(ctx: RenderContext, grouping: "tier" | "team", tagUsers: boolean = true, boldWinners: boolean = false): string {
    const errors = checkErrors(ctx);
    if (errors.hasErrors) return errors.message;

    if (grouping === "tier") return generateTierGroupedBBCode(ctx, tagUsers, boldWinners);
    if (grouping === "team") return generateTeamGroupedBBCode(ctx, tagUsers, boldWinners);
    return "Invalid grouping argument."
}

function checkErrors(ctx: RenderContext) {
    let hasErrors = false;
    let messages: string[] = [];

    const missingSmogon: string[] = [];
    const missingTeam: string[] = [];

    for (const group of ctx.replayGroups) {
        if (!group.p1.smogon) missingSmogon.push(group.p1.ps);
        if (!group.p2.smogon) missingSmogon.push(group.p2.ps);

        if (!group.p1.team) missingTeam.push(group.p1.smogon ?? group.p1.ps);
        if (!group.p2.team) missingTeam.push(group.p2.smogon ?? group.p2.ps);
    }

    if (missingSmogon.length > 0) {
        hasErrors = true;

        const message = `==== Missing Smogon Usernames ====\n${missingSmogon.join('\n')}`;

        messages.push(message);
    }

    if (missingTeam.length > 0) {
        hasErrors = true;

        const message = `==== Missing Team Selection ====\n${missingTeam.join('\n')}`;

        messages.push(message);
    }

    return {
        hasErrors,
        message: messages.join('\n\n')
    }
}

function generateTierGroupedBBCode(ctx: RenderContext, tagUsers: boolean, boldWinners: boolean) {
    return "Not implemented.";
}

function generateTeamGroupedBBCode(ctx: RenderContext, tagUsers: boolean, boldWinners: boolean) {
    
    const matchups = groupByTeam(ctx);

    const blocks = matchups.map(matchup => {
        const header = formatTeamHeader(matchup, ctx.replayGroups);
        const hiddenResults = boldWinners ? '' : formatHiddenResults(matchup);
        const groupLines = matchup.groups.map(g => formatGroup(g, tagUsers, boldWinners)).join("\n\n");
        return `${header}${hiddenResults}\n${groupLines}`;
    });

    return giveTag(blocks.join("\n\n\n"), "center") + generateCredits();
}

function groupByTeam(ctx: RenderContext): TeamMatchup[] {
    const matchups = new Map<string, TeamMatchup>();

    for (const group of ctx.replayGroups) {
        if (!group.p1.team || !group.p2.team) continue;

        const teams = [group.p1.team, group.p2.team].sort((a, b) => a.name.localeCompare(b.name));
        const [teamA, teamB] = teams as [PlayerTeam, PlayerTeam];
        const key = `${teamA.name}|${teamB.name}`;

        group.firstPlayer = group.p1.team.name === teamA.name ? "p1" : "p2";

        if (!matchups.has(key)) {
            matchups.set(key, { teamA, teamB, groups: [] });
        }

        matchups.get(key)!.groups.push(group);
    }

    for (const matchup of matchups.values()) {
        matchup.groups = sortGroupsByTier(matchup.groups, ctx.config.tiers);
    }

    return Array.from(matchups.values());
}

function sortGroupsByTier(groups: ReplayGroup[], tiers: string[]): ReplayGroup[] {
    return [...groups].sort((a, b) => {
        const ai = tiers.indexOf(a.format);
        const bi = tiers.indexOf(b.format);
        const aIndex = ai === -1 ? Infinity : ai;
        const bIndex = bi === -1 ? Infinity : bi;
        return aIndex - bIndex;
    });
}

function formatTeamHeader(matchup: TeamMatchup, replayGroups: ReplayGroup[]): string {
    const { teamA, teamB } = matchup;

    const scoreA = matchup.groups.filter(g => g.p1.team?.name === teamA.name && g.winner === "p1"
        || g.p2.team?.name === teamA.name && g.winner === "p2").length;
    const scoreB = matchup.groups.length - scoreA;

    const mascotA = formatMascot(teamA);
    const mascotB = formatMascot(teamB);
    
    return `${mascotA} ${teamA.name} (${scoreA}) vs (${scoreB}) ${teamB.name} ${mascotB}`;
}

function formatMascot(team: PlayerTeam): string {
    return team.mascot ? `:${team.mascot.toLowerCase()}:` : '';
}

function formatHiddenResults(matchup: TeamMatchup) {
    const results = matchup.groups.map(group => formatGroup(group, false, true, false));
    return `[hide="results"]${results.join('\n')}[/hide]`;
}

function formatGroup(group: ReplayGroup, tagUsers: boolean, boldWinners: boolean, includeLinks: boolean = true): string {
    const p1name = group.p1.smogon!;
    const p2name = group.p2.smogon!;

    const p1str = formatUser(p1name, group.winner === "p1", tagUsers, boldWinners);
    const p2str = formatUser(p2name, group.winner === "p2", tagUsers, boldWinners);

    const [first, second] = group.firstPlayer === "p1" ? [p1str, p2str] : [p2str, p1str];
    const matchLine = `${group.format}: ${first} vs ${second}`;
    const links = includeLinks ? `\n${formatLinks(group)}` : '';

    return `${matchLine}${links}`;
}

function formatUser(name: string, win: boolean, tagUsers: boolean, boldWinners: boolean): string {
    const taggedName = tagUsers ? `@${name}` : name;
    return win && boldWinners ? giveTag(taggedName, "b") : taggedName
}

function formatLinks(replayGroup: ReplayGroup) {
    const formattedLinks = [];
    for (const replay of replayGroup.replays) {
        formattedLinks.push(formatLink(replay, replayGroup.winner));
    }

    return `[center]${formattedLinks.join('\n')}[/center]`;
}

function formatLink(replayData: ParsedReplay, winner: "p1" | "p2") {
    // Always link replays in winner POV by using ?p2 suffix
    // TODO: I just realised this doesn't always work correctly, problem for future me.
    const url = `https://replay.pokemonshowdown.com/${replayData.id}`;
    const suffix = winner === "p1" ? '' : "?p2";

    return `[URL="${url}${suffix}"]${url}[/URL]`;
}

function generateCredits() {
    return `[right][size=2]Generated using the [url="${PROJECT_URL}"]1v1 Replays/Usage tool[/url] by @Felucia[/size][/right]`;
}

function giveTag(text: string, tag: string): string {
    return `[${tag}]${text}[/${tag}]`;
}