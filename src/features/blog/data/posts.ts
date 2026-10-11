import { getCollection, type CollectionEntry } from 'astro:content';
import { sortNewestFirst } from '../model/sort-newest-first';

export type BlogPost = CollectionEntry<'blog'>;

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return sortNewestFirst(posts);
}
