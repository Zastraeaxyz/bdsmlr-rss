import type { APIEvent } from '@solidjs/start/server'
import { resolveIdentifier, getBlog } from '~/lib/api'

export async function GET(event: APIEvent) {
  const url = new URL(event.request.url)
  const username = url.searchParams.get('username')
  const v2session = url.searchParams.get('v2_session') || undefined

  if (!username) {
    return new Response(JSON.stringify({ status: null }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const resolved = await resolveIdentifier(username)
    if (!resolved.blogId) {
      return new Response(JSON.stringify({ status: 'not-found' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await getBlog(resolved.blogId, v2session)
    return new Response(JSON.stringify({ status: data.blog ? 'exists' : 'private' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ status: 'private' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
