import type { APIEvent } from '@solidjs/start/server'
import { fetchBlogFeed, FetchError } from '~/lib/api'

export async function GET(event: APIEvent) {
  const url = new URL(event.request.url)
  const username = url.searchParams.get('username')
  if (!username) {
    return new Response(JSON.stringify({ error: 'Missing username parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const feed = await fetchBlogFeed({
      username,
      page: Number(url.searchParams.get('page')) || undefined,
      v2session: url.searchParams.get('v2_session') || undefined,
    })

    return new Response(JSON.stringify(feed), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    if (e instanceof FetchError) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: e.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    console.error('[preview] error:', e)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
