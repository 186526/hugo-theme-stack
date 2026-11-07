importScripts("/workbox/workbox-sw.js");

workbox.setConfig({
	modulePathPrefix: "/workbox/",
});

const { core, routing, strategies, expiration } = workbox;
const { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } =
	strategies;
const { ExpirationPlugin } = expiration;

const buildVersion = `{{ now.Unix }}`,
	pagesCache = `pages-v${buildVersion}`,
	imagesCache = `images-v${buildVersion}`,
	oneMonth = 30 * 24 * 60 * 60,
	maxEntries = 100;

/*
 * 样式、脚本与字体的文件名带内容哈希，部署后不会变，缓存名也就不随构建变化。
 * 旧版本留下的条目由 ExpirationPlugin 按时间淘汰。
 */
const immutableCache = "static-immutable-v1";

const pageExpiration = new ExpirationPlugin({
	maxEntries: 32,
	maxAgeSeconds: oneMonth,
	purgeOnQuotaError: true,
});

/*
 * 第三方静态资源清单由站点参数 serviceWorker.cachedOrigins 提供，
 * 未配置时只缓存 jsdelivr，避免主题写死某个站点的镜像域名。
 */
const configuredOrigins = {{ site.Params.serviceWorker.cachedOrigins | default (slice "cdn.jsdelivr.net") | jsonify }};
const escapedOrigins = configuredOrigins.map((origin) => origin.replace(/\./g, "\\."));
const cachedOrigin = new RegExp(`^https://(?:${escapedOrigins.join("|")})/`);
const imageFile = /\.(?:png|jpe?g|gif|webp|avif|svg|ico)$/;
const staticAsset = /\.(?:css|js|woff2?)$/;
const dynamicShield = /^\/shields\.io\//;
const pageNavigation = ({ request }) => request.mode === "navigate";
const pagePrefetch = ({ request }) =>
	request.headers.get("purpose") === "prefetch" || request.headers.get("sec-purpose") === "prefetch";
const pagePjax = ({ request }) => request.method === "GET" && request.headers.get("x-pjax") === "1";
const passthrough = /(?:google-analytics\.com|analytics\.google\.com|disqus)/;

const sameOrigin = (url) => url.origin === self.location.origin;

core.setCacheNameDetails({
	prefix: "stack",
	suffix: buildVersion,
});
core.skipWaiting();
core.clientsClaim();

const activeCaches = new Set([pagesCache, imagesCache, immutableCache]);
const managedCache = /^(?:pages-v|images-v|static-immutable-v|static-immutable\/)/;

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
 * PJAX 发出的 XHR 不是 navigate 模式，命中与否取决于下面的预加载规则。
 */
routing.registerRoute(
	pageNavigation,
	new NetworkFirst({
		cacheName: pagesCache,
		networkTimeoutSeconds: 3,
		plugins: [pageExpiration],
	})
);

/*
 * quicklink 用 link rel=prefetch 预加载页面，浏览器发出的预加载请求带 purpose 请求头，
 * fetch 无法自行加这个头，所以这里的匹配只命中预加载。
 * 预加载结果写进 pages 缓存，之后 PJAX 的 XHR 与页面导航都能直接命中。
 */
routing.registerRoute(
	pagePrefetch,
	new NetworkFirst({
		cacheName: pagesCache,
		plugins: [pageExpiration],
	})
);

/*
 * PJAX 的 XHR 先读 pages 缓存，同时请求网络并在成功后更新缓存。
 * 预加载过的页面点击时直接使用缓存，网络断开时也能继续浏览。
 */
routing.registerRoute(
	pagePjax,
	new StaleWhileRevalidate({
		cacheName: pagesCache,
		plugins: [pageExpiration],
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
