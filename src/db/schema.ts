import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const resolvedBlogs = sqliteTable("resolved_blogs", {
  blogName: text("blog_name").primaryKey(),
  responseJson: text("response_json").notNull(),
  createdAt: text("created_at").notNull(),
});

export const pageTokens = sqliteTable(
  "page_tokens",
  {
    blogId: integer("blog_id").notNull(),
    page: integer("page").notNull(),
    pageToken: text("page_token").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.blogId, t.page] }),
  })
);
