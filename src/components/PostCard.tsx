import { Show, For } from 'solid-js'
import type { Post } from '~/lib/api'
import { sanitizeHtml, getPostMediaUrls, getMediaType, processContentHtml } from '~/lib/sanitize'
import { PostType, PostVariant, postTypeLabel, formatRelativeDate } from '~/lib/date'
import { HeartIcon, ChatIcon, ReblogIcon } from './Icons'

export function PostCard(props: { post: Post }) {
  const post = props.post

  const mediaUrls = () => getPostMediaUrls(post)
  const mediaItems = () =>
    mediaUrls().map((url) => ({ url, type: getMediaType(url) }))

  const contentHtml = () => {
    const raw = post.content?.html
    if (!raw) return null
    let html = raw
    if (post.type === PostType.Text) {
      html = processContentHtml(html, mediaUrls())
    }
    html = sanitizeHtml(html)
    return html || null
  }

  return (
    <div class="feed-card">
      <div class="feed-card-header">
        <a
          href={`https://bdsmlr.com/blog/${post.blogName ?? ''}`}
          target="_blank"
          rel="noopener noreferrer"
          class="feed-card-blog"
        >
          {post.blogName}
        </a>
        <span class="feed-card-type">{postTypeLabel(post.type)}</span>
        <Show when={post.createdAtUnix}>
          <span class="feed-card-time">{formatRelativeDate(post.createdAtUnix)}</span>
        </Show>
      </div>

      <Show when={post.variant === PostVariant.Reblog && post.originBlogName}>
        <div class="reblog-attribution">
          &#x21BB; reblogged from{' '}
          <Show when={post.originPostId} fallback={post.originBlogName}>
            <a
              href={`https://bdsmlr.com/post/${post.originPostId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {post.originBlogName}&apos;s post
            </a>
          </Show>
        </div>
      </Show>

      <Show when={post.title}>
        <div class="feed-card-title">{post.title}</div>
      </Show>

      <Show when={contentHtml()}>
        <div class="feed-card-body" innerHTML={contentHtml()!} />
      </Show>

      <Show when={post.type !== PostType.Text && mediaItems().length > 0}>
        <div class="feed-card-images">
          <For each={mediaItems()}>
            {(item) => (
              <Show
                when={item.type === 'image'}
                fallback={
                  <video src={item.url} muted controls preload="metadata" />
                }
              >
                <img src={item.url} alt="" loading="lazy" />
              </Show>
            )}
          </For>
        </div>
      </Show>

      <Show when={post.tags && post.tags.length > 0}>
        <div class="feed-card-tags">
          <For each={post.tags}>
            {(t) => (
              <a
                href={`https://bdsmlr.com/tagged/${encodeURIComponent(t)}`}
                target="_blank"
                rel="noopener noreferrer"
                class="tag"
              >
                #{t}
              </a>
            )}
          </For>
        </div>
      </Show>

      <div class="feed-card-meta">
        <span><HeartIcon /> {post.likesCount ?? 0}</span>
        <span><ChatIcon /> {post.commentsCount ?? 0}</span>
        <span><ReblogIcon /> {post.reblogsCount ?? 0}</span>
        <Show when={post.id}>
          <a
            href={`https://bdsmlr.com/post/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            class="feed-card-permalink"
          >
            Open on BDSMLR
          </a>
        </Show>
      </div>
    </div>
  )
}
