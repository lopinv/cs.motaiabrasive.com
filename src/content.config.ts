import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const frontmatter = z.object({
  slug: z.string(),
  category: z.string(),
  title: z.string(),
  intro: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]).optional(),
  image: z.string().optional(),
  datePublished: z.union([z.string(), z.date()]).optional(),
  dateModified: z.union([z.string(), z.date()]).optional()
})

export const collections = {
  'articles-en': defineCollection({
    loader: glob({ pattern: '**/*.md', base: './articles/en' }),
    schema: frontmatter
  }),
  'articles-i18n': defineCollection({
    loader: glob({
      // Only translated locales: en is the reference corpus in articles-en, so
      // it must not be re-registered here (glob ids must be unique). The `!`
      // negation excludes the en subtree from this collection.
      pattern: ['**/*.md', '!en/**/*.md'],
      base: './articles',
      // entry.entry is "<lang>/<slug>.md"; the id becomes "<lang>/<slug>" so
      // the template looks the article up by the active locale.
      generateId: (entry) => entry.entry.replace(/\.md$/, '')
    }),
    schema: frontmatter
  })
}
