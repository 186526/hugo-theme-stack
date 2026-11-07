declare global {
	interface window {
		"pjax-api": {
			Pjax: any;
		};
	}
}
declare global {
	interface Window {
		NProgress: {
			inc: () => void;
			done: () => void;
		};
		quicklink?: {
			listen: (options?: Record<string, unknown>) => () => void;
		};
	}
}

import pjaxApi from "../lib/pjax-api";
import nprogress = require("../lib/nprogress");

window["pjax-api"] = { Pjax: pjaxApi };
window['NProgress'] = nprogress;

export default class Pjax {
	public pjaxInstance: any;
	private stopPrefetching?: () => void;
	constructor() {
		if (window["pjax-api"] == undefined) {
			console.error("pjax-api lib not loaded.");
			return;
		}
		this.init();
	}
	init() {
		this.pjaxInstance = new window["pjax-api"].Pjax({
			areas: ["body"],
			update: {
				ignores: {
					extension: '[href^="chrome-extension://"]',
					security: '[src*=".scr.kaspersky-labs.com/"]',
					header: "header",
					socialMenu: ".social-menu",
					footer: "footer",
				},
			},
		});
		window.addEventListener("pjax:fetch", () => {
			this.stopPrefetching?.();
			this.stopPrefetching = undefined;
			document.body.classList.remove("show-menu");
			document.getElementById("toggle-menu")?.classList.remove("is-active");
			window.NProgress.inc();
		});
		document.addEventListener("pjax:ready", () => {
			window.Stack.init();
			this.listenQuicklink();
			window.NProgress.done();
		});
		this.listenQuicklink();
	}
	private listenQuicklink() {
		this.stopPrefetching = window.quicklink?.listen({
			/* 跳过当前页、新窗口打开的链接与订阅文件，预取它们不会在导航时被使用 */
			ignores: [
				(href: string) => href === location.href,
				(a: HTMLAnchorElement) => a.target === "_blank",
				(href: string) => /\.xml(\?|$)/.test(href),
			],
		});
	}
}
