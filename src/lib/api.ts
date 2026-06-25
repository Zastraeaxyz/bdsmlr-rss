const API_BASE = "https://api-prod.bdsmlr.com/v2/api";

import { db } from "~/db/sqlite";
import { resolvedBlogs, blogs, pageTokens } from "~/db/schema";
import { eq, and } from "drizzle-orm";

export interface PostContent {
  html?: string;
  text?: string;
  title?: string;
  url?: string;
  quoteText?: string;
  quoteSource?: string;
}

export interface MediaRepresentationItem {
  kind?: number;
  original?: { url?: string };
  alternates?: { url?: string }[];
}

export interface MediaRepresentation {
  kind?: number;
  items?: MediaRepresentationItem[];
}

export interface Post {
  id: number;
  blogId?: number;
  blogName?: string;
  type?: number;
  title?: string;
  body?: string;
  content?: PostContent;
  mediaRepresentation?: MediaRepresentation;
  tags?: string[];
  likesCount?: number;
  commentsCount?: number;
  reblogsCount?: number;
  createdAtUnix?: number;
  originPostId?: number;
  originBlogId?: number;
  originBlogName?: string;
  variant?: number;
}

export interface Blog {
  id: string;
  name: string;
  title?: string;
  description?: string;
  avatarUrl?: string;
  coverUrl?: string;
  followersCount?: string;
  postsCount?: string;
  createdAt?: string;
}

export interface ResolveIdentifierResponse {
  blogId?: number;
  blogName?: string;
  postId?: number | null;
  userId?: number;
  userName?: string | null;
  error?: string;
}

export interface GetBlogResponse {
  blog?: Blog;
  error?: string;
}

export interface ListBlogActivityResponse {
  posts?: Post[];
  timelineItems?: { type: number; post?: Post }[];
  page?: { nextPageToken?: string };
  error?: string;
}

async function bdRequest<T>(
  path: string,
  body: unknown,
  v2session?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (v2session) headers["Cookie"] = `v2_session=${v2session}`;

  const start = Date.now();
  const auth = v2session ? "[auth]" : "";
  console.log(`[bd] --> POST ${path} ${JSON.stringify(body)} ${auth}`);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const duration = Date.now() - start;
    console.log(`[bd] <-- POST ${path} ${res.status} ${duration}ms ${auth}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || err.error || `HTTP ${res.status}`);
    }

    return res.json();
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("HTTP ")) throw e;
    const duration = Date.now() - start;
    console.log(`[bd] <-- POST ${path} FAIL ${duration}ms ${auth}`);
    throw e;
  }
}

export function resolveIdentifier(blogName: string, v2session?: string) {
  return bdRequest<ResolveIdentifierResponse>(
    "/resolve-identifier",
    { blog_name: blogName },
    v2session,
  );
}

export function getBlog(blogId: number, v2session?: string) {
  return bdRequest<GetBlogResponse>(
    "/get-blog",
    { blogId: String(blogId) },
    v2session,
  );
}

export function listBlogActivity(
  blogId: number,
  blogName: string,
  page: number,
  v2session?: string,
  includeReblogs = true,
  pageToken?: string,
) {
  const pageParam = pageToken ? { page_size: 20, page_token: pageToken } : page;

  return bdRequest<ListBlogActivityResponse>(
    "/list-blog-activity",
    {
      blog_id: blogId,
      blog_name: blogName,
      sort_field: 1,
      order: 2,
      post_types: [1, 2, 3, 4, 5, 6, 7],
      activity_kinds: includeReblogs ? ["post", "reblog"] : ["post"],
      page: pageParam,
      page_size: 20,
    },
    v2session,
  );
}

const RESOLVE_CACHE_TTL = Number(process.env.RESOLVE_CACHE_TTL) || 3600;
const BLOG_CACHE_TTL = Number(process.env.BLOG_CACHE_TTL) || 86400;
const PAGE_TOKEN_TTL = Number(process.env.PAGE_TOKEN_TTL) || 1800;

function isFresh(createdAt: string | Date, ttlSeconds: number): boolean {
  const created =
    typeof createdAt === "string"
      ? new Date(createdAt).getTime()
      : createdAt.getTime();
  return Date.now() - created < ttlSeconds * 1000;
}

async function cacheWrite(
  label: string,
  fn: () => Promise<unknown>,
): Promise<void> {
  try {
    await fn();
  } catch (e) {
    console.error(`[cache] write error (${label}):`, e);
  }
}

export async function cachedResolveIdentifier(
  blogName: string,
  v2session?: string,
): Promise<ResolveIdentifierResponse> {
  const key = blogName.trim().toLowerCase();

  try {
    const cached = await db.query.resolvedBlogs.findFirst({
      where: eq(resolvedBlogs.blogName, key),
    });

    if (cached && isFresh(cached.createdAt, RESOLVE_CACHE_TTL)) {
      return JSON.parse(cached.responseJson) as ResolveIdentifierResponse;
    }
  } catch (e) {
    console.error("[cache] read error (resolve):", e);
  }

  const result = await resolveIdentifier(blogName, v2session);

  cacheWrite("resolve", () =>
    db
      .insert(resolvedBlogs)
      .values({
        blogName: key,
        responseJson: JSON.stringify(result),
        createdAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: resolvedBlogs.blogName,
        set: {
          responseJson: JSON.stringify(result),
          createdAt: new Date().toISOString(),
        },
      }),
  );

  return result;
}

export async function cachedGetBlog(
  blogId: number,
  v2session?: string,
): Promise<GetBlogResponse> {
  try {
    const cached = await db.query.blogs.findFirst({
      where: eq(blogs.blogId, blogId),
    });

    if (cached && isFresh(cached.createdAt, BLOG_CACHE_TTL)) {
      return JSON.parse(cached.responseJson) as GetBlogResponse;
    }
  } catch (e) {
    console.error("[cache] read error (blog):", e);
  }

  const result = await getBlog(blogId, v2session);

  cacheWrite("blog", () =>
    db
      .insert(blogs)
      .values({
        blogId,
        responseJson: JSON.stringify(result),
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: blogs.blogId,
        set: {
          responseJson: JSON.stringify(result),
          createdAt: new Date(),
        },
      }),
  );

  return result;
}

export async function getPageToken(
  blogId: number,
  page: number,
): Promise<string | null> {
  try {
    const row = await db.query.pageTokens.findFirst({
      where: and(eq(pageTokens.blogId, blogId), eq(pageTokens.page, page)),
    });
    if (row && isFresh(row.createdAt, PAGE_TOKEN_TTL)) {
      return row.pageToken;
    }
  } catch (e) {
    console.error("[cache] read error (pageToken):", e);
  }
  return null;
}

export async function setPageToken(
  blogId: number,
  page: number,
  token: string,
): Promise<void> {
  cacheWrite("pageToken", () =>
    db
      .insert(pageTokens)
      .values({
        blogId,
        page,
        pageToken: token,
        createdAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [pageTokens.blogId, pageTokens.page],
        set: { pageToken: token, createdAt: new Date().toISOString() },
      }),
  );
}

export interface BlogFeed {
  blog: Blog;
  posts: Post[];
  page: number;
}

export async function fetchBlogFeed(params: {
  username: string;
  page?: number;
  v2session?: string;
  includeReblogs?: boolean;
}): Promise<BlogFeed> {
  const page = Math.max(1, params.page || 1);
  const v2session = params.v2session || undefined;
  const includeReblogs = params.includeReblogs !== false;

  const resolved = await cachedResolveIdentifier(params.username, v2session);
  if (!resolved.blogId) {
    throw new FetchError(
      `Blog "${params.username}" not found — check the spelling`,
      404,
    );
  }

  const blogId = resolved.blogId;
  const pageToken =
    page > 1 ? ((await getPageToken(blogId, page)) ?? undefined) : undefined;

  try {
    const [blogData, activity] = await Promise.all([
      cachedGetBlog(blogId, v2session),
      listBlogActivity(
        blogId,
        resolved.blogName || params.username,
        page,
        v2session,
        includeReblogs,
        pageToken,
      ),
    ]);

    if (!blogData.blog) {
      throw new FetchError(
        `Blog "${params.username}" is private — expand "Authentication" above and paste your v2_session cookie`,
        403,
      );
    }

    if (activity.page?.nextPageToken) {
      await setPageToken(blogId, page + 1, activity.page.nextPageToken);
    }

    return { blog: blogData.blog, posts: activity.posts || [], page };
  } catch (e) {
    if (e instanceof FetchError) throw e;
    throw new FetchError(
      `Blog "${params.username}" is private — expand "Authentication" above and paste your v2_session cookie`,
      403,
    );
  }
}

export class FetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
