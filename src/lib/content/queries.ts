import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { CollectionName } from './types';

function byId<T extends { id: string }>(left: T, right: T) {
  return left.id.localeCompare(right.id, 'en');
}

export async function getTracks() {
  return (await getCollection('tracks')).sort(byId);
}

export async function getTopics() {
  return (await getCollection('topics')).sort(byId);
}

export async function getLessons() {
  return (await getCollection('lessons')).sort(byId);
}

export async function getPreviewLessons() {
  return (await getLessons()).filter((entry) => entry.data.status !== 'planned');
}

export async function getPublishedLessons() {
  return (await getLessons()).filter((entry) => entry.data.status === 'published');
}

export async function getProblems() {
  return (await getCollection('problems')).sort(byId);
}

export async function getPublishedProblems() {
  return (await getProblems()).filter((entry) => entry.data.status === 'published');
}

export async function getPublishedTracks() {
  return (await getTracks()).filter((entry) => entry.data.status === 'published');
}

export async function getPublishedTopics() {
  return (await getTopics()).filter((entry) => entry.data.status === 'published');
}

export async function getRequiredTrack(id: string): Promise<CollectionEntry<'tracks'>> {
  return requireEntry('tracks', id);
}

export async function getRequiredTopic(id: string): Promise<CollectionEntry<'topics'>> {
  return requireEntry('topics', id);
}

export async function getRequiredLesson(id: string): Promise<CollectionEntry<'lessons'>> {
  return requireEntry('lessons', id);
}

export async function getRequiredProblem(id: string): Promise<CollectionEntry<'problems'>> {
  return requireEntry('problems', id);
}

async function requireEntry<C extends CollectionName>(
  collection: C,
  id: string,
): Promise<CollectionEntry<C>> {
  const entry = await getEntry({ collection, id });
  if (!entry) {
    throw new Error(`Missing ${collection} entry: ${id}`);
  }
  return entry as CollectionEntry<C>;
}
