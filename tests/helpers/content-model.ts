import { parse as parseYaml } from 'yaml';
import type { ContentModel, SourceEntry } from '../../src/lib/content/types';

export function cloneModel(model: ContentModel): ContentModel {
  return structuredClone(model);
}

export function sourceEntry<K extends SourceEntry['collection']>(
  collection: K,
  sourcePath: string,
  data: Extract<SourceEntry, { collection: K }>['data'],
): SourceEntry<K> {
  return { collection, id: data.id, sourcePath, data } as SourceEntry<K>;
}

export function parseFixture<T>(contents: string): T {
  return parseYaml(contents) as T;
}
