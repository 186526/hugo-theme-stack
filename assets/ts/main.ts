/*!
 *   Hugo Theme Stack
 *
 *   @author: Jimmy Cai
 *   @website: https://jimmycai.com
 *   @link: https://github.com/CaiJimmy/hugo-theme-stack
 */
import StackGallery from "ts/gallery";
import { getColor } from "ts/color";
import menu from "ts/menu";
import createElement from "ts/createElement";
import StackColorScheme from "ts/colorScheme";
import { setupScrollspy } from "ts/scrollspy";
import { setupSmoothAnchors } from "ts/smoothAnchors";
import Pjax from "ts/pjax";

type PrintChangeEvent = { matches: boolean; colorScheme?: boolean };

let isMoved = false;

function getHtmlElement(): HTMLElement {
	return document.documentElement;
}

function hasQueryParam(name: string): boolean {
	return new URL(window.location.href).searchParams.has(name);
}

function moveToc() {
	if (isMoved) return;
	isMoved = true;

	if (!document.body.classList.contains("article-page")) return;

	const rightSidebar = document.querySelector(".right-sidebar");
	const tocWidget = rightSidebar?.querySelector(".widget--toc");
	const content = document.querySelector(".article-content");
	const parent = content?.parentElement;

	if (!tocWidget || !content || !parent) return;

	const toc = tocWidget.cloneNode(true);
	parent.insertBefore(toc, content);
}

function handlePrintChange(event: PrintChangeEvent) {
	const html = getHtmlElement();

	if (event.matches) {
		if (!event.colorScheme) html.setAttribute("data-scheme", "light");
		html.setAttribute("print-scheme", "enable");

		moveToc();
	} else {
		html.setAttribute("print-scheme", "disable");
	}
}

function checkURLPrintFlags() {
	if (hasQueryParam("print")) {
		handlePrintChange({
			matches: true,
			colorScheme: true,
		});
	} else {
		handlePrintChange({
			matches: false,
		});
	}

	if (!hasQueryParam("withoutFooter")) return;

	const footer = document.querySelector("footer.site-footer") as HTMLElement | null;
	if (footer) footer.style.display = "none";
}

function setupArticleContentEnhancements() {
	const articleContent = document.querySelector(
		".article-content"
	) as HTMLElement | null;
	if (!articleContent) return;

	new StackGallery(articleContent);
	setupSmoothAnchors();
	setupScrollspy();
}

function setupTileGradientBackground() {
	const articleTile = document.querySelector(".article-list--tile");
	if (!articleTile) return;

	const observer = new IntersectionObserver((entries, currentObserver) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) return;
			currentObserver.unobserve(entry.target);

			const articles = entry.target.querySelectorAll("article.has-image");
			articles.forEach(async (article) => {
				const image = article.querySelector("img");
				const articleDetails = article.querySelector(
					".article-details"
				) as HTMLDivElement | null;

				if (!image || !articleDetails) return;

				const imageURL = image.src;
				const key = image.getAttribute("data-key");
				const hash = image.getAttribute("data-hash");
				if (!key || !hash) return;

				const colors = await getColor(key, hash, imageURL);

				articleDetails.style.background = `
                        linear-gradient(0deg,
                            rgba(${colors.DarkMuted.rgb[0]}, ${colors.DarkMuted.rgb[1]}, ${colors.DarkMuted.rgb[2]}, 0.5) 0%,
                            rgba(${colors.Vibrant.rgb[0]}, ${colors.Vibrant.rgb[1]}, ${colors.Vibrant.rgb[2]}, 0.75) 100%)`;
			});
		});
	});

	observer.observe(articleTile);
}

function setupCodeCopyButtons() {
	const highlights = document.querySelectorAll(".article-content div.highlight");
	const copyText = "Copy";
	const copiedText = "Copied!";

	highlights.forEach((highlight) => {
		const copyButton = document.createElement("button");
		copyButton.innerHTML = copyText;
		copyButton.classList.add("copyCodeButton");
		highlight.appendChild(copyButton);

		const codeBlock = highlight.querySelector("code[data-lang]");
		if (!codeBlock) return;

		copyButton.addEventListener("click", () => {
			navigator.clipboard
				.writeText(codeBlock.textContent)
				.then(() => {
					copyButton.textContent = copiedText;

					setTimeout(() => {
						copyButton.textContent = copyText;
					}, 1000);
				})
				.catch((err) => {
					alert(err);
					console.log("Something went wrong", err);
				});
		});
	});
}

function setupPrintListener() {
	const printMedia = window.matchMedia("print");
	handlePrintChange(printMedia);
	printMedia.addEventListener("change", handlePrintChange);
}

type StackApp = {
	colorScheme: StackColorScheme | null;
	reset: () => void;
	init: () => void;
};

const Stack: StackApp = {
	colorScheme: null,
	reset: () => {
		isMoved = false;

		menu();
		setupArticleContentEnhancements();
		setupTileGradientBackground();
		setupCodeCopyButtons();

		const darkModeToggle = document.getElementById("dark-mode-toggle");
		Stack.colorScheme = darkModeToggle
			? new StackColorScheme(darkModeToggle)
			: null;

		setupPrintListener();
		checkURLPrintFlags();
	},
	init: () => {
		Stack.reset();
		new Pjax();
	},
};

Stack.init();

declare global {
	interface Window {
		createElement: any;
		Stack: any;
	}
}

window.Stack = Stack;
window.createElement = createElement;
