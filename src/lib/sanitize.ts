import type { Post } from '~/lib/api'

export function sanitizeHtml(html: string): string {
  const cleaned = html.replace(/<[a-z][a-z0-9]*\b[^>]*>/gi, (tag) => {
    if (/^<p\b/i.test(tag)) return "<p>"
    return tag.replace(/\sstyle\s*=\s*["'][^"']*["']/gi, "")
  })
  if (/^\s*<p>\s*<br\b[^>]*>\s*<\/p>\s*$/i.test(cleaned)) return ""
  return cleaned
}

export function getPostMediaUrls(post: Post): string[] {
  const items = post.mediaRepresentation?.items
  if (!items || items.length === 0) return []
  return items
    .map((item) => item.original?.url)
    .filter((url): url is string => !!url)
}

export function getMediaType(url: string): 'image' | 'video' {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase()
  if (ext && ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) return 'video'
  return 'image'
}

export function processContentHtml(html: string, urls: string[]): string {
  if (!urls || urls.length === 0) return html

  const fileMap = new Map<string, string>()
  for (const url of urls) {
    const filename = url.split('/').pop()?.split('?')[0]
    if (filename) fileMap.set(filename, url)
  }

  return html.replace(
    /<img\b[^>]*src\s*=\s*["']([^"']*)["'][^>]*>/gi,
    (_, src) => {
      const cdnFilename = src.split('/').pop()?.split('?')[0]
      const url = (cdnFilename && fileMap.get(cdnFilename)) || src
      const type = getMediaType(url)
      if (type === 'video') {
        return `<video src="${url}" muted controls preload="metadata"></video>`
      }
      return `<img src="${url}" alt="" />`
    },
  )
}
