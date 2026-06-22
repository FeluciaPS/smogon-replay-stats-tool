const md = markdownit();

type MarkdownFile = "CHANGELOG" | "FAQ";
const markdownHtml = {
    "CHANGELOG": "",
    "FAQ": ""
}

async function loadFile(file: MarkdownFile): Promise<string> {
    if (markdownHtml[file]) return markdownHtml[file];
    const response = await fetch(`./markdown/${file}.md`);

    if (!response.ok) {
        throw new Error(`Failed to load markdown file for ${file}: ${response.status}`);
    }

    const text = await response.text();

    const renderedText = md.render(text);
    markdownHtml[file] = renderedText;
    return renderedText;
}

const modal = document.getElementById("dynamic_modal") as HTMLDialogElement;

async function openModal(file: MarkdownFile) {
    const html = await loadFile(file);
    document.getElementById("modal_content")!.innerHTML = html;
    modal.showModal();
}

document.getElementById("changelog_open_btn")!.addEventListener("click", () => {
    openModal("CHANGELOG");
});

document.getElementById("faq_open_btn")!.addEventListener("click", () => {
    openModal("FAQ");
})

document.querySelector("#dynamic_modal > .close_button")!.addEventListener("click", () => {
    modal.close();
});

modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
});