import type { Blog, Post } from './api'
import { getPostMediaUrls } from './api'

function escapeXml(s: string | undefined | null): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toRfc822(ts: number | undefined): string {
  if (!ts) return ''
  return new Date(ts * 1000).toUTCString()
}

function postDescription(post: Post): string {
  const parts: string[] = []

  const html = post.content?.html
  if (html) {
    const urls = getPostMediaUrls(post)
    if (urls.length > 0) {
      let body = html
      for (const url of urls) {
        const filename = url.split('/').pop()?.split('?')[0]
        if (filename) {
          body = body.replace(
            new RegExp(`<img[^>]*src\\s*=\\s*["'][^"']*${filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*["'][^>]*>`, 'gi'),
            `<img src="${escapeXml(url)}" alt="" />`,
          )
        }
      }
      parts.push(body)
    } else {
      parts.push(html)
    }
  } else if (post.content?.text) {
    parts.push(`<p>${escapeXml(post.content.text)}</p>`)
  }

  const text = post.body
  if (text && !html) {
    parts.push(`<p>${escapeXml(text)}</p>`)
  }

  if (post.variant === 2 && post.originBlogName) {
    parts.push(`<p><em>Reblogged from ${escapeXml(post.originBlogName)}</em></p>`)
  }

  if (post.tags && post.tags.length > 0) {
    parts.push('<p>' + post.tags.map(t => `<a href="https://bdsmlr.com/tagged/${escapeXml(t)}">#${escapeXml(t)}</a>`).join(' ') + '</p>')
  }

  return parts.join('\n')
}

interface RssInput {
  blog: Blog
  posts: Post[]
  feedUrl: string
}

export function generateRss({ blog, posts, feedUrl }: RssInput): string {
  const title = blog.title || blog.name
  const link = `https://bdsmlr.com/blog/${blog.name}`
  const desc = blog.description || ''

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n'
  xml += '<channel>\n'
  xml += `  <title>${escapeXml(title)}</title>\n`
  xml += `  <link>${escapeXml(link)}</link>\n`
  xml += `  <description>${escapeXml(desc)}</description>\n`
  if (feedUrl) {
    xml += `  <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>\n`
  }
  xml += `  <generator>bdsmlr-rss</generator>\n`

  for (const post of posts) {
    const postLink = `https://bdsmlr.com/post/${post.id}`
    const postTitle = post.title || (post.content?.text
      ? post.content.text.substring(0, 80) + (post.content.text.length > 80 ? '...' : '')
      : post.body?.substring(0, 80) + ((post.body?.length ?? 0) > 80 ? '...' : '') || `Post ${post.id}`)
    const pubDate = toRfc822(post.createdAtUnix)

    xml += '  <item>\n'
    xml += `    <title>${escapeXml(postTitle)}</title>\n`
    xml += `    <link>${escapeXml(postLink)}</link>\n`
    xml += `    <guid isPermaLink="true">${escapeXml(postLink)}</guid>\n`
    if (pubDate) {
      xml += `    <pubDate>${pubDate}</pubDate>\n`
    }
    const desc = postDescription(post)
    if (desc) {
      xml += `    <description>${escapeXml(desc)}</description>\n`
    }
    if (post.blogName) {
      xml += `    <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${escapeXml(post.blogName)}</dc:creator>\n`
    }
    xml += '  </item>\n'
  }

  xml += '</channel>\n'
  xml += '</rss>\n'

  return xml
}
