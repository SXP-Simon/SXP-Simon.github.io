# Helian's Blog 📄

> 极简美学、毫秒级响应、类型安全的个人数字花园。

- **博客网址**: [https://heliannuits.me](https://heliannuits.me)
- **作者**: Helian ([@SXP-Simon](https://github.com/SXP-Simon))
- **技术栈**: [Astro](https://astro.build/) + [AstroPaper](https://github.com/satnaing/astro-paper) + [Tailwind CSS](https://tailwindcss.com/) + [Pagefind](https://pagefind.app/)

---

## 🌟 核心特性

- ⚡️ **极致性能**：基于 Astro 纯静态构建，零多余客户端 JS，Lighthouse 满分体验。
- 🌓 **深浅色模式**：原生支持深浅色无缝切换，跟随系统偏好。
- 🔍 **离线全文检索**：内置 Pagefind 毫秒级轻量全文索引与搜索。
- 📝 **丰富写作体验**：原生支持 Markdown / MDX、语法高亮、代码块一键复制、公式渲染。
- 🏷️ **归档与标签**：内置文章归档（Archives）、标签（Tags）聚合。
- 🚀 **自动化 CI/CD**：内置 GitHub Actions 工作流，代码推送即自动部署至 GitHub Pages。
- 🌐 **自定义域名**：已绑定 `heliannuits.me`（内置 CNAME 支持）。

---

## 🛠️ 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 启动本地开发服务 (支持热更新)
pnpm dev

# 3. 生产打包与生成搜索索引
pnpm build

# 4. 本地预览构建产物
pnpm preview
```

---

## ✍️ 如何写新文章

在 `src/content/posts/` 目录下新建 `.md` 或 `.mdx` 文件，并在文件头部添加 Frontmatter 元数据：

```markdown
---
author: Helian
pubDatetime: 2026-08-20T16:00:00Z
title: 文章标题
featured: false
draft: false
tags:
  - 技术
  - 随笔
description: 这是文章的简要描述...
---

这里开始正文内容...
```

---

## 🚀 自动部署至 GitHub Pages

项目已在 `.github/workflows/deploy.yml` 配置了 GitHub Actions 自动部署工作流：

1. 在 GitHub 仓库设置中：`Settings` -> `Pages` -> `Build and deployment` -> `Source` 选择 **GitHub Actions**。
2. 每次将代码 `git push` 到 `main` 分支，GitHub Actions 就会自动完成构建并发布到 `heliannuits.me`。
