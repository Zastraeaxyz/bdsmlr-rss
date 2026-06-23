import type { APIEvent } from '@solidjs/start/server'
import { resolveIdentifier, getBlog, listBlogActivity } from '~/lib/api'
import { generateRss } from '~/lib/rss'

export async function GET(event: APIEvent) {
  const username = event.params.username
  const url = new URL(event.request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const v2session = url.searchParams.get('v2_session') || undefined

  try {
    const resolved = await resolveIdentifier(username, v2session)
    if (!resolved.blogId) {
      return new Response(resolved.error || 'Blog not found', { status: 404 })
    }

    const [blogData, activity] = await Promise.all([
      getBlog(resolved.blogId, v2session),
      listBlogActivity(resolved.blogId, resolved.blogName || username, page, v2session),
    ])

    if (!blogData.blog) {
      return new Response('Blog not found', { status: 404 })
    }

    const xml = generateRss({
      blog: blogData.blog,
      posts: activity.posts || [],
      feedUrl: url.href,
    })

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
      },
    })
  } catch (e) {
    console.error('[rss] error:', e)
    return new Response('Internal server error', { status: 500 })
  }
}
