import RSS from 'rss'
import type { Blog, Post } from './api'
import { getPostMediaUrls } from './api'

function getMediaType(url: string): 'image' | 'video' {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase()
  if (ext && ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) return 'video'
  return 'image'
}

function processBodyHtml(html: string, urls: string[]): string {
  if (!urls || urls.length === 0) return html

  const fileMap = new Map<string, string>()
  for (const url of urls) {
    const filename = url.split('/').pop()?.split('?')[0]
    if (filename) fileMap.set(filename, url)
  }

  return html.replace(
    /<img\b[^>]*src\s*=\s*["']([^"']*)["'][^>]*>/gi,
    (_, src) => {
      const cdnFilename = src.split('/').pop()?.split('?')[0]
      const url = (cdnFilename && fileMap.get(cdnFilename)) || src
      const type = getMediaType(url)
      if (type === 'video') {
        return `<video src="${url}" muted controls preload="metadata"></video>`
      }
      return `<img src="${url}" alt="" />`
    },
  )
}

function postDescription(post: Post): string {
  const parts: string[] = []

  const html = post.content?.html
  const mediaUrls = getPostMediaUrls(post)

  if (html) {
    parts.push(processBodyHtml(html, mediaUrls))
  } else if (post.content?.text) {
    parts.push(`<p>${post.content.text}</p>`)
  }

  const text = post.body
  if (text && !html) {
    parts.push(`<p>${text}</p>`)
  }

  if (post.variant === 2 && post.originBlogName) {
    parts.push(`<p><em>Reblogged from ${post.originBlogName}</em></p>`)
  }

  if (post.tags && post.tags.length > 0) {
    parts.push(
      '<p>' +
        post.tags
          .map(
            (t) =>
              `<a href="https://bdsmlr.com/tagged/${encodeURIComponent(t)}">#${t}</a>`,
          )
          .join(' ') +
        '</p>',
    )
  }

  return parts.join('\n')
}

function postTitle(post: Post): string {
  if (post.title) return post.title
  const text = post.content?.text || post.body
  if (text) {
    return text.length > 80 ? text.substring(0, 80) + '...' : text
  }
  return `Post ${post.id}`
}

interface RssInput {
  blog: Blog
  posts: Post[]
  feedUrl: string
}

export function generateRss({ blog, posts, feedUrl }: RssInput): string {
  const feed = new RSS({
    title: blog.title || blog.name,
    description: blog.description || '',
    feed_url: feedUrl,
    site_url: `https://bdsmlr.com/blog/${blog.name}`,
    generator: 'bdsmlr-rss',
  })

  for (const post of posts) {
    feed.item({
      title: postTitle(post),
      description: postDescription(post),
      url: `https://bdsmlr.com/post/${post.id}`,
      guid: `https://bdsmlr.com/post/${post.id}`,
      date: post.createdAtUnix ? new Date(post.createdAtUnix * 1000) : new Date(),
      author: post.blogName,
      categories: post.tags,
    })
  }

  return feed.xml({ indent: true })
}
