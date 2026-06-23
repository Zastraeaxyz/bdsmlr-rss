import { createResource, Show, For } from 'solid-js'
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
}

export default function Preview(props: { fetchParams: () => Params | null }) {
  const [preview] = createResource(props.fetchParams, async (params) => {
    if (!params.u) return null
    const qs = new URLSearchParams({ username: params.u, page: String(params.p) })
    if (params.s) qs.set('v2_session', params.s)
    const res = await fetch(`/api/preview?${qs}`)
    if (!res.ok) throw new Error('Preview fetch failed')
    return res.json() as Promise<PreviewResult>
  })

  return (
    <>
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
              {(post) => <PostCard post={post} />}
            </For>
          </div>
        </section>
      </Show>
    </>
  )
}
