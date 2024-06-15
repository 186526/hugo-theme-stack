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

let isMoved: boolean = false;

function moveToc() {
	if (isMoved) return;
	else isMoved = true;

	if (document.querySelector("body").classList.contains("article-page")) {
		if (document.querySelector(".right-sidebar")) {
			const toc = document
				.querySelector(".right-sidebar")
				.querySelector(".widget--toc")
				.cloneNode(true);

			const content = document.querySelector(".article-content");
			content.parentElement.insertBefore(toc, content);
		}
	}
}

function handlePrintChange(event: { matches: boolean; colorScheme?: boolean }) {
	if (event.matches) {
		if (!event.colorScheme)
			document.querySelector("html").setAttribute("data-scheme", "light");
		document.querySelector("html").setAttribute("print-scheme", "enable");

		moveToc();
	} else {
		document.querySelector("html").setAttribute("print-scheme", "disable");
	}
}

function checkURLhasPrint() {
	if (new URL(window.location.href).searchParams.has("print")) {
		handlePrintChange({
			matches: true,
			colorScheme: true,
		});
	} else {
		handlePrintChange({
			matches: false,
		});
	}

	if (new URL(window.location.href).searchParams.has("withoutFooter")) {
		(<HTMLElement>document.querySelector("footer.site-footer")).style.display =
			"none";
	}
}

let Stack = {
	colorScheme: null,
	reset: () => {
		isMoved = false;
		/**
		 * Bind menu event
		 */
		menu();

		const articleContent = document.querySelector(
			".article-content"
		) as HTMLElement;
		if (articleContent) {
			new StackGallery(articleContent);
			setupSmoothAnchors();
			setupScrollspy();
		}

		/**
		 * Add linear gradient background to tile style article
		 */
		const articleTile = document.querySelector(".article-list--tile");
		if (articleTile) {
			let observer = new IntersectionObserver(async (entries, observer) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) return;
					observer.unobserve(entry.target);

					const articles = entry.target.querySelectorAll("article.has-image");
					articles.forEach(async (articles) => {
						const image = articles.querySelector("img"),
							imageURL = image.src,
							key = image.getAttribute("data-key"),
							hash = image.getAttribute("data-hash"),
							articleDetails: HTMLDivElement =
								articles.querySelector(".article-details");

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

		/**
		 * Add copy button to code block
		 */
		const highlights = document.querySelectorAll(
			".article-content div.highlight"
		);
		const copyText = `Copy`,
			copiedText = `Copied!`;

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

		Stack.colorScheme = new StackColorScheme(
			document.getElementById("dark-mode-toggle")
		);

		handlePrintChange(window.matchMedia("print"));
		window.matchMedia("print").addEventListener("change", handlePrintChange);

		if (window.matchMedia("(max-width: 1024px)").matches) {
			moveToc();
		}

		checkURLhasPrint();
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
