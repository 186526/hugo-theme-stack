importScripts("/workbox/workbox-sw.js");

workbox.setConfig({
	modulePathPrefix: "/workbox/",
});

const { core, routing, strategies, expiration } = workbox;
const { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } =
	strategies;
const { ExpirationPlugin } = expiration;

const buildVersion = `{{ now.Unix }}`,
	immutableCache = `static-immutable-v${buildVersion}`,
	pagesCache = `pages-v${buildVersion}`,
	imagesCache = `images-v${buildVersion}`,
	oneMonth = 30 * 24 * 60 * 60,
	maxEntries = 100;

const cachedOrigin = new RegExp(
	`^https://(?:unpkg\\.assets\\.real186526\\.cn|cdn\\.jsdelivr\\.net|fonts\\.googleapis\\.com|fonts\\.googleapis\\.cn|fonts\\.gstatic\\.com)/`
);
const imageFile = /\.(?:png|jpe?g|gif|webp|avif|svg|ico)$/;
const staticAsset = /\.(?:css|js|woff2?)$/;
const dynamicShield = /^\/shields\.io\//;
const pageNavigation = ({ request }) => request.mode === "navigate";
const passthrough = /(?:google-analytics\.com|analytics\.google\.com|disqus)/;

const sameOrigin = (url) => url.origin === self.location.origin;

core.setCacheNameDetails({
	prefix: "stack",
	suffix: buildVersion,
});
core.skipWaiting();
core.clientsClaim();

const activeCaches = new Set([pagesCache, imagesCache, immutableCache]);
const managedCache =
	/^(?:pages-v|images-v|static-immutable-v|static-immutable\/|blog-cache\/|stack-runtime-|disqus-)/;

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((key) => managedCache.test(key) && !activeCaches.has(key))
						.map((key) => caches.delete(key))
				)
			)
	);
});

/*
 * 页面导航始终先请求网络，离线时回退到最近一次成功加载的页面。
 * PJAX 发出的 XHR 不是 navigate 模式，因此永远拿不到缓存里的旧文档。
 */
routing.registerRoute(
	pageNavigation,
	new NetworkFirst({
		cacheName: pagesCache,
		networkTimeoutSeconds: 3,
		plugins: [
			new ExpirationPlugin({
				maxEntries: 32,
				maxAgeSeconds: oneMonth,
				purgeOnQuotaError: true,
			}),
		],
	})
);

/*
 * 第三方静态资源按地址缓存，内容不会变化。
 */
routing.registerRoute(
	cachedOrigin,
	new CacheFirst({
		cacheName: immutableCache,
		fetchOptions: {
			mode: "cors",
			credentials: "omit",
		},
		plugins: [
			new ExpirationPlugin({
				maxEntries,
				maxAgeSeconds: oneMonth,
				purgeOnQuotaError: true,
			}),
		],
	})
);

/*
 * shields.io 徽章内容随时间变化，地址固定，不能进永久缓存。
 * 这条必须排在图片规则之前，徽章地址同样以图片后缀结尾。
 */
routing.registerRoute(
	({ url }) => sameOrigin(url) && dynamicShield.test(url.pathname),
	new NetworkOnly(),
	"GET"
);

/*
 * 本站图片先返回缓存，同时在后台更新。
 * 图片地址不带内容哈希，换图后必须能刷新。
 */
routing.registerRoute(
	({ url }) => sameOrigin(url) && imageFile.test(url.pathname),
	new StaleWhileRevalidate({
		cacheName: imagesCache,
		plugins: [
			new ExpirationPlugin({
				maxEntries,
				maxAgeSeconds: oneMonth,
				purgeOnQuotaError: true,
			}),
		],
	})
);

/*
 * 本站样式、脚本和字体文件名带内容哈希，缓存后不再更新。
 */
routing.registerRoute(
	({ url }) => sameOrigin(url) && staticAsset.test(url.pathname),
	new CacheFirst({
		cacheName: immutableCache,
		plugins: [
			new ExpirationPlugin({
				maxEntries,
				maxAgeSeconds: oneMonth,
				purgeOnQuotaError: true,
			}),
		],
	})
);

routing.registerRoute(passthrough, new NetworkOnly());

routing.setDefaultHandler(new NetworkOnly());
