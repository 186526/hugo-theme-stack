declare global {
	interface Window {
		umami?: {
			track: (eventName: string, data?: Record<string, unknown>) => void;
		};
	}
}

const FONT_STYLESHEET = /^\/fonts\/(?:inter|fira-code|noto-sans-sc)(?:\.[0-9a-f]+)?\.css$/;

function countFontFaces(): number {
	return [...document.styleSheets]
		.filter((sheet) => FONT_STYLESHEET.test(new URL(sheet.href ?? "", window.location.href).pathname))
		.reduce((total, sheet) => {
			try {
				return total + [...sheet.cssRules].filter((rule) => rule.type === CSSRule.FONT_FACE_RULE).length;
			} catch {
				return total;
			}
		}, 0);
}

function countFontRequests(): number {
	const fonts = performance.getEntriesByType("resource").filter((entry) => /\.woff2?$/.test(entry.name));

	return fonts.filter((entry) => entry.transferSize > 0).length;
}

function readNavigationTiming() {
	const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;

	if (!navigation) {
		return {};
	}

	return {
		ttfb: Math.round(navigation.responseStart - navigation.startTime),
		domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.startTime),
		load: Math.round(navigation.loadEventEnd - navigation.startTime),
	};
}

export function reportPageDetails() {
	const umami = window.umami;

	if (!umami) {
		return;
	}

	umami.track("page-details", {
		...readNavigationTiming(),
		fontFaces: countFontFaces(),
		fontRequests: countFontRequests(),
		viewport: `${window.innerWidth}x${window.innerHeight}`,
		dpr: window.devicePixelRatio,
		connection: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType ?? "unknown",
	});
}
