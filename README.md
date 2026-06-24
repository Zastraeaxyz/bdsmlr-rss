# BDSMLR RSS Generator

A proxy RSS generator for BDSMLR blogs that fixes broken image feeds. BDSMLR recently changed how it delivers images, so older feeds contain image links that no longer work. This tool fetches fresh data from BDSMLR's API and generates RSS with valid, working image links.

Primarily designed for importing BDSMLR blogs into imaglr via RSS Feed Importer.

**[Try it here →](https://bdsmlr-rss.up.railway.app)**

## Usage

1. Enter a BDSMLR blog username
2. Optionally set authentication for private blogs (see below)
3. Preview the feed
4. Copy the generated RSS URL and paste it into your feed reader or imaglr's RSS importer

### Private blogs

Some blogs require authentication. To access them:

1. Log into BDSMLR in your browser
2. Open DevTools (F12) → Application → Cookies → bdsmlr.com
3. Copy the value of `v2_session`
4. Paste it into the **Authentication** section on the generator page

The token is used only for authenticating requests to BDSMLR's API and is never stored or logged by this service.

## How it works

BDSMLR previously served images via unsigned S3 URLs. They have since moved to signed URLs, but their official RSS feeds still output the old unsigned file paths. Since S3 now rejects unsigned requests, images in the official feeds fail to render.

This app bypasses the broken official RSS and calls BDSMLR's JSON API directly, which returns the correct signed media URLs. It then generates standards-compliant RSS 2.0 feeds including both standard `<enclosure>` elements and Yahoo Media RSS `<media:content>` elements with the working URLs.

## Privacy

No data is collected. Queries are not tied to the tokens used for viewing private blogs. The `v2_session` parameter is stripped from server logs.

## License

MIT
