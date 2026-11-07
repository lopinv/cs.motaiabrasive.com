/**
 * 博客列表页分页参数。每页固定 24 张卡片（3 列 × 4 组），223 篇文章
 * → 每语种 10 页；单页 HTML 从 ~215 KB 降到 ~25 KB，首屏只渲染 24 篇。
 *
 * URL 约定：第 1 页是 /blog/（无 page 段），第 n 页是 /blog/page/n/。
 * 第 1 页与 page/1 不并存——getStaticPaths 不为 n=1 生成 page 段，
 * canonical 也始终指向当前页自身（含 page/2 自指），避免重复内容。
 */
export const BLOG_PAGE_SIZE = 24
export const BLOG_PAGER_MAX = 200 // 安全上限：语料增长时页面数不会失控

/**
 * 文章分类集合。定义在模块里而不是页面 frontmatter：export function
 * getStaticPaths 会被 bundler 提升到模块前部，而 const 声明不提升——
 * CATS 放在页面顶层时，getStaticPaths 运行期间它还在 TDZ，直接抛
 * "CATS is not defined"。从共享模块 import 没有这个问题。
 */
export const BLOG_CATEGORIES = [
  { key: 'selection-guide', i18n: 'catSelection' },
  { key: 'buyer-resources', i18n: 'catBuyer' },
  { key: 'application-notes', i18n: 'catNotes' },
  { key: 'oem-guide', i18n: 'catOem' }
]

/** 分页元信息（页码、页数、首末篇序号），供模板与 SEO 使用。 */
export function pagerInfo(total, page) {
  const pages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE))
  const current = Math.min(Math.max(1, page), pages)
  const from = (current - 1) * BLOG_PAGE_SIZE + 1
  const to = Math.min(total, current * BLOG_PAGE_SIZE)
  return { current, pages, from, to, total }
}
