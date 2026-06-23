import { Title } from '@solidjs/meta'
import { createSignal, createResource, Show, For } from 'solid-js'
import type { Blog, Post } from '~/lib/api'
import { PostCard } from '~/components/PostCard'

interface PreviewResult {
  blog: Blog
  posts: Post[]
  page: number
}

export default function Home() {
  const [username, setUsername] = createSignal('')
  const [v2session, setV2session] = createSignal('')
  const [page, setPage] = createSignal(1)
  const [fetchParams, setFetchParams] = createSignal<{ u: string; s: string; p: number } | null>(null)

  const [preview] = createResource(fetchParams, async (params) => {
    if (!params.u) return null
    const qs = new URLSearchParams({ username: params.u, page: String(params.p) })
    if (params.s) qs.set('v2_session', params.s)
    const res = await fetch(`/api/preview?${qs}`)
    if (!res.ok) throw new Error('Preview fetch failed')
    return res.json() as Promise<PreviewResult>
  })

  function handlePreview(e: Event) {
    e.preventDefault()
    setFetchParams({ u: username().trim(), s: v2session().trim(), p: page() })
  }

  function feedUrl() {
    const u = username().trim()
    if (!u) return ''
    const qs = new URLSearchParams()
    const s = v2session().trim()
    if (s) qs.set('v2_session', s)
    if (page() !== 1) qs.set('page', String(page()))
    const q = qs.toString()
    return `${location.origin}/rss/${u}${q ? '?' + q : ''}`
  }

  return (
    <main>
      <Title>BDSMLR RSS</Title>
      <h1>BDSMLR RSS Generator</h1>
      <p>Generate an RSS feed URL for any BDSMLR blog. Paste the URL into your RSS reader.</p>

      <form onSubmit={handlePreview}>
        <label for="username">Blog username</label>
        <input
          id="username"
          type="text"
          placeholder="e.g. thecagestore"
          value={username()}
          onInput={e => setUsername(e.currentTarget.value)}
          required
        />

        <details>
          <summary>Authentication (optional)</summary>
          <p>
            Some blogs require authentication. Paste your <code>v2_session</code> cookie value below.
          </p>
          <p>
            To find it: open BDSMLR in your browser, open DevTools (F12),
            go to <strong>Application</strong> → <strong>Cookies</strong> →
            select <strong>bdsmlr.com</strong>, then copy the <code>v2_session</code> value.
          </p>
          <label for="v2session">v2_session cookie</label>
          <input
            id="v2session"
            type="text"
            placeholder="Paste cookie value here"
            value={v2session()}
            onInput={e => setV2session(e.currentTarget.value)}
          />
        </details>

        <label for="page">Page</label>
        <input
          id="page"
          type="number"
          min="1"
          value={page()}
          onInput={e => setPage(Number(e.currentTarget.value) || 1)}
        />

        <Show when={feedUrl()}>
          <label for="feedUrl">Feed URL</label>
          <input
            id="feedUrl"
            type="text"
            readOnly
            value={feedUrl()}
            onClick={e => e.currentTarget.select()}
          />
        </Show>

        <button type="submit">Preview</button>
      </form>

      <Show when={preview.loading}>
        <p>Loading...</p>
      </Show>

      <Show when={preview.error}>
        <p class="error">Error: {preview.error.message}</p>
      </Show>

      <Show when={preview()}>
        <section>
          <h2>{preview()!.blog.title || preview()!.blog.name}</h2>
          <Show when={preview()!.blog.description}>
            <p>{preview()!.blog.description}</p>
          </Show>

          <h3>Posts (page {preview()!.page})</h3>
          <Show when={preview()!.posts.length === 0}>
            <p>No posts found.</p>
          </Show>
          <div class="feed">
            <For each={preview()!.posts}>
              {post => <PostCard post={post} />}
            </For>
          </div>
        </section>
      </Show>
    </main>
  )
}
