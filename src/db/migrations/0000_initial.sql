CREATE TABLE `resolved_blogs` (
  `blog_name` text PRIMARY KEY NOT NULL,
  `response_json` text NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `page_tokens` (
  `blog_id` integer NOT NULL,
  `page` integer NOT NULL,
  `page_token` text NOT NULL,
  `created_at` text NOT NULL,
  PRIMARY KEY(`blog_id`, `page`)
);
