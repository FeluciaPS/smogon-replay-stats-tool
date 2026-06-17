"use strict";
const md = markdownit();
async function loadChangelog() {
    const response = await fetch("./CHANGELOG.md");
    if (!response.ok) {
        throw new Error(`Failed to load changelog: ${response.status}`);
    }
    const text = await response.text();
    document.getElementById("changelog_content").innerHTML = md.render(text);
}
loadChangelog();
const modal = document.getElementById("changelog_modal");
document.getElementById("changelog_open_btn").addEventListener("click", () => {
    modal.showModal();
});
document.getElementById("changelog_close_btn").addEventListener("click", () => {
    modal.close();
});
modal.addEventListener("click", (e) => {
    if (e.target === modal)
        modal.close();
});
