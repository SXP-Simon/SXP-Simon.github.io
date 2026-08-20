import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://heliannuits.me/",
    title: "Helian's Blog",
    description: "Helian 的个人博客，记录技术、思考与生活。",
    author: "Helian",
    profile: "https://github.com/SXP-Simon",
    ogImage: "default-og.jpg",
    lang: "zh-CN",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 6,
    perIndex: 6,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/SXP-Simon/SXP-Simon.github.io/edit/main/",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github", url: "https://github.com/SXP-Simon", linkTitle: "GitHub: @SXP-Simon" },
    { name: "netease", url: "https://music.163.com/#/user/home?id=1607315848", linkTitle: "网易云音乐: Helian" },
    { name: "wechat", url: "#", linkTitle: "微信: night-helianthus (点击复制)" },
  ],
  shareLinks: [
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});