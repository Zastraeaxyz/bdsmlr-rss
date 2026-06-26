import { createResource, createSignal, createEffect, on, Show, For } from 'solid-js'
import type { Blog, Post } from '~/lib/api'
import { PostCard } from './PostCard'

interface PreviewResult {
  blog: Blog
  posts: Post[]
  page: number
}

interface Params {
  u: string
  s: string
  p: number
  r: boolean
}

export default function Preview(props: { fetchParams: () => Params | null }) {
  const [page, setPage] = createSignal(1)
  const [displayData, setDisplayData] = createSignal<PreviewResult | null>(null)
  const [loadingNext, setLoadingNext] = createSignal(false)

  const [preview] = createResource(props.fetchParams, async (params) => {
    if (!params.u) return null
    const qs = new URLSearchParams({ username: params.u, page: '1' })
    if (params.s) qs.set('v2_session', params.s)
    if (params.r) qs.set('include_reblogs', '1')
    const res = await fetch(`/api/preview?${qs}`)
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      if (res.status === 404) {
        window.alert('Blog not found')
      } else if (res.status === 403) {
        window.alert('Blog requires authentication')
      } else {
        window.alert(body?.error || 'Preview failed')
      }
      return null
    }
    return res.json() as Promise<PreviewResult>
  })

  createEffect(on(
    () => props.fetchParams(),
    () => {
      setPage(1)
      setDisplayData(null)
    }
  ))

  createEffect(() => {
    const p = preview()
    if (p) {
      setPage(1)
      setDisplayData(p)
    }
  })

  async function fetchPage(target: number) {
    const params = props.fetchParams()
    if (!params?.u) return
    setLoadingNext(true)
    try {
      const qs = new URLSearchParams({ username: params.u, page: String(target) })
      if (params.s) qs.set('v2_session', params.s)
      if (params.r) qs.set('include_reblogs', '1')
      const res = await fetch(`/api/preview?${qs}`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        window.alert(body?.error || 'Failed to load page')
        return
      }
      const data = await res.json() as PreviewResult
      setDisplayData(data)
      setPage(target)
    } finally {
      setLoadingNext(false)
    }
  }

  return (
    <>
      <Show when={preview.loading && !displayData()}>
        <p>Loading...</p>
      </Show>

      <Show when={preview.error && !displayData()}>
        <p class="error">Error: {preview.error.message}</p>
      </Show>

      <Show when={displayData()}>
        <section>
          <h2>{displayData()!.blog.title || displayData()!.blog.name}</h2>
          <Show when={displayData()!.blog.description}>
            <p>{displayData()!.blog.description}</p>
          </Show>

          <div class="posts-header">
            <h3>Posts (page {displayData()!.page})</h3>
            <Show when={displayData()!.posts.length > 0}>
              <div class="page-nav">
                <Show when={page() > 1}>
                  <button onClick={() => fetchPage(page() - 1)} disabled={loadingNext()}>
                    {loadingNext() ? 'Loading...' : 'Previous'}
                  </button>
                </Show>
                <button onClick={() => fetchPage(page() + 1)} disabled={loadingNext()}>
                  {loadingNext() ? 'Loading...' : 'Next Page'}
                </button>
              </div>
            </Show>
          </div>
          <Show when={displayData()!.posts.length === 0 && page() === 1}>
            <p>No posts found.</p>
          </Show>
          <div class="feed">
            <For each={displayData()!.posts}>
              {(post) => <PostCard post={post} />}
            </For>
          </div>

          <Show when={displayData()!.posts.length > 0}>
            <div class="page-nav">
              <Show when={page() > 1}>
                <button onClick={() => fetchPage(page() - 1)} disabled={loadingNext()}>
                  {loadingNext() ? 'Loading...' : 'Previous'}
                </button>
              </Show>
              <button onClick={() => fetchPage(page() + 1)} disabled={loadingNext()}>
                {loadingNext() ? 'Loading...' : 'Next Page'}
              </button>
            </div>
          </Show>
        </section>
      </Show>
    </>
  )
}
