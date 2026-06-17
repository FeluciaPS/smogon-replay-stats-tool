import { generateBBCode } from "./output.js";
import { setAlias, setPlayerTeam } from "./storage.js";
import type { ReplayGroup, PlayerTeam, RenderContext, PlayerData } from "./types";
import { el } from "./utils.js";

const BBCODE_DEBOUNCE = 1000;

const REPLAY_CONTAINER_ID = "review_container";

let bbcodeDebounceTimer: number | null = null;

export function renderMascotFields(teams: PlayerTeam[]): void {
    const container = document.getElementById("mascot_fields")!;
    container.innerHTML = "";

    for (const team of teams) {
        const row = el("div", "macot_row")
        row.dataset.teamName = team.name;

        const label = el("span");
        label.textContent = team.name;

        row.appendChild(label);

        const mascotInput = el("input", "mascot_input");
        mascotInput.type = "text";
        mascotInput.placeholder = "Mascot";
        mascotInput.value = team.mascot ?? '';
        row.appendChild(mascotInput);

        container.appendChild(row);
    }
}

export function renderReplayData(ctx: RenderContext): void {
    const container = document.getElementById(REPLAY_CONTAINER_ID)!;
    container.innerHTML = "";

    for (const [index, group] of ctx.replayGroups.entries()) {
        container.appendChild(createGroupCard(group, index, ctx));
    }
}

function createGroupCard(
    group: ReplayGroup, 
    index: number, 
    ctx: RenderContext
): HTMLElement {
    const card = el("div", "group-card");
    card.dataset.groupIndex = String(index);

    card.appendChild(createHeader(group));
    card.appendChild(createReplayList(group));
    card.appendChild(createPlayerRow(group, index, "p1", ctx));
    card.appendChild(createPlayerRow(group, index, "p2", ctx));
    card.appendChild(createFormatRow(group, index, ctx));
    // Remove swap buttons for now
    // card.appendChild(createSwapButton(group, index, ctx));

    return card;
}

function createHeader(group: ReplayGroup): HTMLElement {
    const header = el("h3", "group-header");
    header.textContent = formatGroupHeader(group);

    return header;
}

function createReplayList(group: ReplayGroup): HTMLElement {
    const replayList = el("ul", "replay-list");
    for (const replay of group.replays) {
        const li = el("li");
        const a = el("a");

        a.href = `https://replay.pokemonshowdown.com/${replay.id}`;
        a.textContent = replay.id;
        a.target = "_blank";

        li.appendChild(a);
        replayList.appendChild(li);
    }

    return replayList;
}

function createFormatRow(
    group: ReplayGroup, 
    index: number, 
    ctx: RenderContext
): HTMLElement {
    const formatRow = el("div", "format-row");
    const formatLabel = el("label");
    formatLabel.textContent = "Format: ";
    const formatInput = el("input");
    formatInput.type = "text";
    formatInput.value = group.format;

    formatInput.addEventListener("input", () => {
        updateGroup(ctx, () => {
            group.format = formatInput.value;
        }, index);
    });

    formatRow.appendChild(formatLabel);
    formatRow.appendChild(formatInput);
    return formatRow;
}

function createSwapButton(
    group: ReplayGroup, 
    index: number, 
    ctx: RenderContext
): HTMLElement {
    const swapBtn = document.createElement("button");
    swapBtn.textContent = "Swap p1/p2";

    swapBtn.addEventListener("click", () => {
        updateGroup(ctx, () => {
            group.firstPlayer = group.firstPlayer === "p1" ? "p2" : "p1";
        }, index);
    });

    return swapBtn;
}

function createPlayerRow(
    group: ReplayGroup, 
    index: number, 
    player: "p1" | "p2", 
    ctx: RenderContext
): HTMLElement {
    const playerData = group[player];
    const row = el("div", "player-row");
    
    const psLabel = el("span");
    psLabel.textContent = playerData.ps;
        
    row.appendChild(psLabel);

    row.appendChild(createSmogonInput(playerData, index, ctx));
    row.appendChild(createTeamSelect(playerData, ctx));

    return row;
}

function createSmogonInput(
    playerData: PlayerData, 
    index: number, 
    ctx: RenderContext
): HTMLElement {
    const smogonInput = el("input");
    smogonInput.type = "text";
    smogonInput.placeholder = "Smogon username";
    smogonInput.value = playerData.smogon ?? "";

    smogonInput.addEventListener("input", () => {
        updateGroup(ctx, () => {
            playerData.smogon = smogonInput.value || null;
            setAlias(playerData.ps, smogonInput.value);
        }, index);
    });

    return smogonInput;
}

function createTeamSelect(
    playerData: PlayerData, 
    ctx: RenderContext
): HTMLElement {
    const teamSelect = el("select");
    const emptyOption = el("option");
    emptyOption.value = "";
    emptyOption.textContent = "- no team -";
    teamSelect.appendChild(emptyOption);

    for (const team of ctx.config.teams) {
        const option = el("option");
        option.value = team.name;
        option.textContent = team.name;
        if (playerData.team?.name === team.name) option.selected = true;

        teamSelect.appendChild(option);
    }

    teamSelect.addEventListener("change", () => {
        updateGroup(ctx, () => {
            const selected = ctx.config.teams.find(t => t.name === teamSelect.value) ?? null;
            playerData.team = selected ? { name: selected.name, mascot: selected.mascot } : null;
            if (selected && playerData.smogon) setPlayerTeam(playerData.smogon, selected.name);
        });
    });

    return teamSelect;
}

function updateHeader(
    groupIndex: number, 
    replayGroups: ReplayGroup[]
): void {
    const card = document.querySelector(`[data-group-index="${groupIndex}"]`);
    const header = card?.querySelector(".group-header");
    if (header) header.textContent = formatGroupHeader(replayGroups[groupIndex]!);
}

function formatGroupHeader(group: ReplayGroup): string {
    const p1 = group.p1.smogon ?? group.p1.ps;
    const p2 = group.p2.smogon ?? group.p2.ps;
    const winner = group[group.winner].smogon ?? group[group.winner].ps;
    const [first, second] = group.firstPlayer === "p1" ? [p1, p2] : [p2, p1];
    return `${first} vs ${second} (${group.format}) — Winner: ${winner}`;
}

function scheduleBBCodeUpdate(ctx: RenderContext): void {
    if (bbcodeDebounceTimer) clearTimeout(bbcodeDebounceTimer);

    bbcodeDebounceTimer = window.setTimeout(() => {
        const output = document.getElementById("bbcode_output") as HTMLTextAreaElement;
        output.value = generateBBCode(ctx, "team");
    }, BBCODE_DEBOUNCE);
}

function updateGroup(
    ctx: RenderContext,
    callback: () => void,
    groupIndex?: number
): void {
    callback();

    if (groupIndex !== undefined) {
        updateHeader(groupIndex, ctx.replayGroups);
    }

    scheduleBBCodeUpdate(ctx);
}