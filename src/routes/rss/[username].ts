import type { APIEvent } from '@solidjs/start/server'
import { fetchBlogFeed, FetchError } from '~/lib/api'
import { generateRss } from '~/lib/rss'

export async function GET(event: APIEvent) {
  const url = new URL(event.request.url)

  try {
    const feed = await fetchBlogFeed({
      username: event.params.username,
      page: Number(url.searchParams.get('page')) || undefined,
      v2session: url.searchParams.get('v2_session') || undefined,
      includeReblogs: url.searchParams.get('include_reblogs') === '1',
    })

    const xml = generateRss({
      blog: feed.blog,
      posts: feed.posts,
      feedUrl: url.href,
    })

    return new Response(xml, {
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    })
  } catch (e) {
    if (e instanceof FetchError) {
      return new Response(e.message, { status: e.status })
    }
    console.error('[rss] error:', e)
    return new Response('Internal server error', { status: 500 })
  }
}
