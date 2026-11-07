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

脚本把 Inter、Fira Code 按 ASCII 裁剪成单块，把 Noto Sans SC、Noto Serif SC 切成七块，每种字重各一份，写入 `public/fonts/`。中文块的分组如下：

- 第 0 到 2 块：`public/` 里所有页面出现的汉字，按出现次数从多到少排序后三等分。
- 第 3 到 5 块：`scripts/common-hanzi.txt` 里的常用汉字中，站点页面没有用到的部分，三等分。
- 第 6 块：全角标点。

`unicode-range` 只合并连续码位，块与块之间不重叠。`@font-face` 按块号从大到小声明，同权重时块号小的规则最后声明。按 CSS Fonts 4 第 4.5.1 节，重叠时后声明的规则优先，这样同权重下块 0 优先于块 3 到 5。输出文件名带内容哈希，块内字符集合不变时哈希不变。`static/fonts/noto-sans-sc.css` 是构建前的占位文件，脚本每次运行都会重写它。

环境变量 `FONT_CHUNK_PUBLIC_DIR` 与 `FONT_CHUNK_CACHE_DIR` 分别覆盖输出目录与缓存目录，默认 `public` 与 `.cache`。Inter 与 Fira Code 的源文件在 `assets/fonts/`，Noto 字体从 `scripts/build-font-chunks.mjs` 里的 `sourceUrl` 下载并缓存。

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
