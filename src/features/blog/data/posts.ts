import { getCollection, type CollectionEntry } from 'astro:content';
import { siteEnv } from '@shared/seo/site-env';
import { draftsVisible } from '../model/draft-visibility';
import { sortNewestFirst } from '../model/sort-newest-first';

export type BlogPost = CollectionEntry<'blog'>;

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => draftsVisible(import.meta.env.DEV, siteEnv(import.meta.env.SITE_ENV)) || !data.draft);
  return sortNewestFirst(posts);
}
