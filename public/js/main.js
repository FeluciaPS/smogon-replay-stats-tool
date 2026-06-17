import { generateBBCode } from "./output.js";
import { renderMascotFields, renderReplayData } from "./rendering.js";
import { groupReplays, loadReplays, parseReplays } from "./replay.js";
import { loadConfig, saveConfig } from "./storage.js";
function populateConfigFromStorage() {
    const config = loadConfig();
    if (!config)
        return;
    const tiersInput = document.getElementById("tiers_input");
    tiersInput.value = config.tiers.join("\n");
    const teamsInput = document.getElementById("teams_input");
    teamsInput.value = config.teams.map(t => t.name).join("\n");
    renderMascotFields(config.teams);
}
populateConfigFromStorage();
function readConfigFromDOM() {
    const tiersInput = document.getElementById("tiers_input");
    const tiers = tiersInput.value
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);
    const teams = [];
    const mascotRows = document.querySelectorAll(".macot_row");
    for (const row of mascotRows) {
        const name = row.dataset.teamName;
        if (!name)
            continue;
        const mascotInput = row.querySelector(".mascot_input");
        teams.push({
            name,
            mascot: mascotInput.value.trim() || null,
        });
    }
    return { teams, tiers };
}
function handleSetupTeams() {
    const teamsInput = document.getElementById("teams_input");
    const names = teamsInput.value.split("\n").map(s => s.trim()).filter(Boolean);
    const existing = loadConfig()?.teams ?? [];
    const teams = names.map(name => ({
        name,
        mascot: existing.find(t => t.name === name)?.mascot ?? ""
    }));
    renderMascotFields(teams);
}
async function handleLoadReplays() {
    const replayBox = document.getElementById("replay_input");
    const urls = replayBox.value;
    if (!urls)
        return;
    const config = readConfigFromDOM();
    saveConfig(config);
    const replayData = await loadReplays(urls.split("\n"));
    const parsedReplayData = await parseReplays(replayData);
    const replayGroups = await groupReplays(parsedReplayData, config);
    const ctx = {
        replayGroups,
        config
    };
    renderReplayData(ctx);
    const output = document.getElementById("bbcode_output");
    output.value = generateBBCode(ctx, "team");
}
async function preloadReplays() {
    const replayBox = document.getElementById("replay_input");
    const urls = replayBox.value;
    if (!urls)
        return;
    loadReplays(urls.split('\n'), true);
}
let preloadDebounceTimer = null;
const PRELOAD_DEBOUNCE = 400;
function schedulePreload() {
    if (preloadDebounceTimer) {
        clearTimeout(preloadDebounceTimer);
    }
    preloadDebounceTimer = window.setTimeout(preloadReplays, PRELOAD_DEBOUNCE);
}
document.getElementById("load_replays_btn")
    .addEventListener("click", handleLoadReplays);
document.getElementById("setup_teams_btn")
    .addEventListener("click", handleSetupTeams);
document.getElementById("replay_input")
    .addEventListener("input", schedulePreload);
document.getElementById("copy_button")
    .addEventListener("click", () => {
    const output = document.getElementById("bbcode_output");
    navigator.clipboard.writeText(output.value);
});
