![image](https://user-images.githubusercontent.com/5889006/190859441-141b5f81-8483-40d2-bd96-ebf85616a46d.png)

# Hugo Theme Stack

<img align="right" width="150" alt="logo" src="https://user-images.githubusercontent.com/5889006/190859553-5b229b4f-c476-4cbd-928f-890f5265ca4c.png">

Card-style Hugo theme designed for bloggers.

## Quickstart

Use this template: [CaiJimmy/hugo-theme-stack-starter](https://github.com/CaiJimmy/hugo-theme-stack-starter)

## Demo

Check [demo.stack.cai.im](https://demo.stack.cai.im)

## Documentation

- [English](https://stack.cai.im)
- [中文](https://stack.cai.im/zh)

## Fonts

`layouts/_partials/head/custom-font.html` 链接 `/fonts/inter.css`、`/fonts/fira-code.css`、`/fonts/noto-sans-sc.css` 与 `/fonts/noto-serif-sc.css`。这些样式表由 `scripts/build-font-chunks.mjs` 生成，`hugo` 本身不产出它们。

先安装依赖，再在 `hugo` 之后运行脚本：

```bash
npm install subset-font
hugo
node themes/stack/scripts/build-font-chunks.mjs
```

脚本把 Inter、Fira Code 按 ASCII 裁剪成单块，把 Noto Sans SC、Noto Serif SC 按 `scripts/font-chunks.json` 的字表切成多块，每种字重各一份，写入 `public/fonts/`。输出文件名带内容哈希，字表与字体不变时哈希不变。`static/fonts/noto-sans-sc.css` 是构建前的占位文件，脚本每次运行都会重写它。

环境变量 `FONT_CHUNK_PUBLIC_DIR` 与 `FONT_CHUNK_CACHE_DIR` 分别覆盖输出目录与缓存目录，默认 `public` 与 `.cache`。Inter 与 Fira Code 的源文件在 `assets/fonts/`，Noto 字体与 Google Fonts 的分块 CSS 从 `scripts/build-font-chunks.mjs` 里的 `sourceUrl` 下载并缓存。

## Footer

`footer.fork` 控制页脚的 Fork 署名，`footer.shieldsBase` 控制 MoeICP、Commit 与 Latest Update 三个徽章的地址前缀。两者都不配置时不输出对应内容。

```toml
[footer]
shieldsBase = "https://example.com/shields.io"

[footer.fork]
name = "Forked"
url = "https://github.com/you/hugo-theme-stack"

[footer.fork.author]
name = "your-name"
url = "https://example.com"
```

## Service worker

`assets/sw.js` 从 `serviceWorker.cachedOrigins` 读取需要永久缓存的第三方资源域名，未配置时只缓存 `cdn.jsdelivr.net`。

```toml
[serviceWorker]
cachedOrigins = ["cdn.jsdelivr.net", "fonts.googleapis.com"]
```

## Copyright

**Licensed under the GNU General Public License v3.0**

Please do not remove the "*Theme Stack designed by Jimmy*" text and link.

If you want to port this theme to another blogging platform, please let me know🙏.
