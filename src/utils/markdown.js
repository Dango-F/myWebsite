import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          "</code></pre>"
        );
      } catch (__) {}
    }

    return (
      '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + "</code></pre>"
    );
  },
});

export function renderMarkdown(content) {
  if (!content) return "";
  return md.render(content);
}

export function extractFirstImage(content) {
  const imgMatch = content.match(/!\[.*?\]\((.*?)\)/);
  return imgMatch ? imgMatch[1] : null;
}

export function extractExcerpt(content, length = 150) {
  // 移除Markdown标记和链接
  const plainText = content
    .replace(/!\[.*?\]\(.*?\)/g, "") // 图片
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // 链接
    .replace(/#{1,6}\s?([^#]*)/g, "$1") // 标题
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // 粗体
    .replace(/(\*|_)(.*?)\1/g, "$2") // 斜体
    .replace(/~~(.*?)~~/g, "$1") // 删除线
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1") // 代码块
    .replace(/```[\s\S]*?```/g, "") // 代码块
    .replace(/^\s*[\-\*]\s+/gm, "") // 列表
    .replace(/^\s*\d+\.\s+/gm, "") // 有序列表
    .trim();

  return plainText.length > length
    ? plainText.substring(0, length) + "..."
    : plainText;
}

export function formatDateTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);

  // 日期格式化，精确到秒
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default {
  renderMarkdown,
  extractFirstImage,
  extractExcerpt,
};
