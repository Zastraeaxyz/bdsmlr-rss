import type { APIEvent } from '@solidjs/start/server'
import { resolveIdentifier, getBlog, listBlogActivity } from '~/lib/api'

export async function GET(event: APIEvent) {
  const url = new URL(event.request.url)
  const username = url.searchParams.get('username')
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const v2session = url.searchParams.get('v2_session') || undefined

  if (!username) {
    return new Response(JSON.stringify({ error: 'Missing username parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const resolved = await resolveIdentifier(username, v2session)
    if (!resolved.blogId) {
      return new Response(JSON.stringify({ error: resolved.error || 'Blog not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const [blogData, activity] = await Promise.all([
      getBlog(resolved.blogId, v2session),
      listBlogActivity(resolved.blogId, resolved.blogName || username, page, v2session),
    ])

    return new Response(JSON.stringify({
      blog: blogData.blog,
      posts: activity.posts || [],
      page,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[preview] error:', e)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
