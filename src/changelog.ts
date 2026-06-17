const md = markdownit();

async function loadChangelog(): Promise<void> {
    const response = await fetch("./CHANGELOG.md");

    if (!response.ok) {
        throw new Error(`Failed to load changelog: ${response.status}`);
    }

    const text = await response.text();

    document.getElementById("changelog_content")!.innerHTML = md.render(text);
}

loadChangelog();


const modal = document.getElementById("changelog_modal") as HTMLDialogElement;

document.getElementById("changelog_open_btn")!.addEventListener("click", () => {
    modal.showModal();
});

document.querySelector("#changelog_modal > .close_button")!.addEventListener("click", () => {
    modal.close();
});

modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
});