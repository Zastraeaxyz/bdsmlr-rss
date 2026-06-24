import type { APIEvent } from '@solidjs/start/server'
import { cachedResolveIdentifier } from '~/lib/api'

export async function GET(event: APIEvent) {
  const url = new URL(event.request.url)
  const blogName = url.searchParams.get('blog_name')
  const v2session = url.searchParams.get('v2_session') || undefined

  if (!blogName) {
    return new Response(JSON.stringify({ error: 'Missing blog_name param' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const result = await cachedResolveIdentifier(blogName, v2session)
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to resolve' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
