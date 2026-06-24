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

  const start = Date.now()
  const auth = v2session ? '[auth]' : ''
  console.log(`[bd] --> POST ${path} ${JSON.stringify(body)} ${auth}`)

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const duration = Date.now() - start
    console.log(`[bd] <-- POST ${path} ${res.status} ${duration}ms ${auth}`)

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || err.error || `HTTP ${res.status}`)
    }

    return res.json()
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('HTTP ')) throw e
    const duration = Date.now() - start
    console.log(`[bd] <-- POST ${path} FAIL ${duration}ms ${auth}`)
    throw e
  }
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

export interface BlogFeed {
  blog: Blog
  posts: Post[]
  page: number
}

export async function fetchBlogFeed(params: {
  username: string
  page?: number
  v2session?: string
}): Promise<BlogFeed> {
  const page = Math.max(1, params.page || 1)
  const v2session = params.v2session || undefined

  const resolved = await resolveIdentifier(params.username, v2session)
  if (!resolved.blogId) {
    throw new FetchError(`Blog "${params.username}" not found — check the spelling`, 404)
  }

  try {
    const [blogData, activity] = await Promise.all([
      getBlog(resolved.blogId, v2session),
      listBlogActivity(resolved.blogId, resolved.blogName || params.username, page, v2session),
    ])

    if (!blogData.blog) {
      throw new FetchError(
        `Blog "${params.username}" is private — expand "Authentication" above and paste your v2_session cookie`,
        403,
      )
    }

    return { blog: blogData.blog, posts: activity.posts || [], page }
  } catch (e) {
    if (e instanceof FetchError) throw e
    throw new FetchError(
      `Blog "${params.username}" is private — expand "Authentication" above and paste your v2_session cookie`,
      403,
    )
  }
}

export class FetchError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
