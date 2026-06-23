const API_BASE = 'https://api-prod.bdsmlr.com/v2/api'

export interface PostContent {
  html?: string
  text?: string
  title?: string
  url?: string
  quoteText?: string
  quoteSource?: string
}

export interface MediaRepresentationItem {
  kind?: number
  original?: { url?: string }
  alternates?: { url?: string }[]
}

export interface MediaRepresentation {
  kind?: number
  items?: MediaRepresentationItem[]
}

export interface Post {
  id: number
  blogId?: number
  blogName?: string
  type?: number
  title?: string
  body?: string
  content?: PostContent
  mediaRepresentation?: MediaRepresentation
  tags?: string[]
  likesCount?: number
  commentsCount?: number
  reblogsCount?: number
  createdAtUnix?: number
  originPostId?: number
  originBlogId?: number
  originBlogName?: string
  variant?: number
}

export interface Blog {
  id: string
  name: string
  title?: string
  description?: string
  avatarUrl?: string
  coverUrl?: string
  followersCount?: string
  postsCount?: string
  createdAt?: string
}

export interface ResolveIdentifierResponse {
  blogId?: number
  blogName?: string
  postId?: number | null
  userId?: number
  userName?: string | null
  error?: string
}

export interface GetBlogResponse {
  blog?: Blog
  error?: string
}

export interface ListBlogActivityResponse {
  posts?: Post[]
  timelineItems?: { type: number; post?: Post }[]
  page?: { nextPageToken?: string }
  error?: string
}

async function bdRequest<T>(
  path: string,
  body: unknown,
  v2session?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (v2session) headers['Cookie'] = `v2_session=${v2session}`

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export function resolveIdentifier(blogName: string, v2session?: string) {
  return bdRequest<ResolveIdentifierResponse>(
    '/resolve-identifier',
    { blog_name: blogName },
    v2session,
  )
}

export function getBlog(blogId: number, v2session?: string) {
  return bdRequest<GetBlogResponse>(
    '/get-blog',
    { blogId: String(blogId) },
    v2session,
  )
}

export function listBlogActivity(
  blogId: number,
  blogName: string,
  page: number,
  v2session?: string,
) {
  return bdRequest<ListBlogActivityResponse>(
    '/list-blog-activity',
    {
      blog_id: blogId,
      blog_name: blogName,
      sort_field: 1,
      order: 2,
      post_types: [1, 2, 3, 4, 5, 6, 7],
      activity_kinds: ['post', 'reblog'],
      page,
      page_size: 20,
    },
    v2session,
  )
}

export function getPostMediaUrls(post: Post): string[] {
  const items = post.mediaRepresentation?.items
  if (!items || items.length === 0) return []
  return items
    .map((item) => item.original?.url)
    .filter((url): url is string => !!url)
}
