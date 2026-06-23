export const PostType = {
  Text: 1,
  Image: 2,
  Video: 3,
  Audio: 4,
  Link: 5,
  Chat: 6,
  Quote: 7,
} as const

export const PostVariant = {
  Unspecified: 0,
  Original: 1,
  Reblog: 2,
} as const

export function postTypeLabel(type: number | undefined): string {
  switch (type) {
    case 0: return 'General'
    case 1: return 'Text'
    case 2: return 'Image'
    case 3: return 'Video'
    case 4: return 'Audio'
    case 5: return 'Link'
    case 6: return 'Chat'
    case 7: return 'Quote'
    default: return 'Unknown'
  }
}

export function formatRelativeDate(unixTimestamp: number | undefined): string {
  if (!unixTimestamp) return ''
  const date = new Date(unixTimestamp * 1000)
  const now = new Date()

  const timeStr = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()

  const getDayDiff = (d1: Date, d2: Date) => {
    const t1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate()).getTime()
    const t2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate()).getTime()
    return Math.round((t2 - t1) / (1000 * 60 * 60 * 24))
  }

  const dayDiff = getDayDiff(date, now)

  if (dayDiff === 0) return `Today at ${timeStr}`
  if (dayDiff === 1) return `Yesterday at ${timeStr}`
  if (dayDiff >= 2 && dayDiff <= 6) {
    const dayName = date.toLocaleDateString([], { weekday: 'long' })
    return `${dayName} at ${timeStr}`
  }

  const monthDay = date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
  const dateStr =
    date.getFullYear() !== now.getFullYear()
      ? `${monthDay}, ${date.getFullYear()}`
      : monthDay
  return `${dateStr} at ${timeStr}`
}
