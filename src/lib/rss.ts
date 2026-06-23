import RSS from 'rss'
import type { Blog, Post } from './api'
import { getPostMediaUrls, getMediaType, processContentHtml } from './sanitize'

function postDescription(post: Post): string {
  const parts: string[] = []

  const html = post.content?.html
  const mediaUrls = getPostMediaUrls(post)
  let hasMedia = false

  if (html) {
    const processed = processContentHtml(html, mediaUrls)
    hasMedia = /<(?:img|video)\b/i.test(processed)
    parts.push(processed)
  } else if (post.content?.text) {
    parts.push(`<p>${post.content.text}</p>`)
  }

  const text = post.body
  if (text && !html) {
    parts.push(`<p>${text}</p>`)
  }

  if (!hasMedia) {
    for (const url of mediaUrls) {
      const type = getMediaType(url)
      if (type === 'video') {
        parts.push(`<video src="${url}" muted controls preload="metadata"></video>`)
      } else {
        parts.push(`<img src="${url}" alt="" />`)
      }
    }
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
