import tour from '../../data/tour.json';
export const chapters = [
  { name: 'Знакомство', start: 0 }, { name: 'Жизнь вместе', start: 2 },
  { name: 'Личное', start: 4 }, { name: 'Практичность', start: 9 }, { name: 'Снаружи', start: 12 },
] as const;
export function chapterForScene(index: number) {
  let chapter = 0;
  chapters.forEach((entry, i) => { if (index >= entry.start) chapter = i; });
  return chapter;
}
export function sceneIndexForId(id: string) { return tour.scenes.findIndex(scene => scene.id === id); }
export function sceneEntryTime(index: number) { return index === 0 ? 0 : tour.scenes[index]!.start + tour.transition; }
export const tourSceneEvent = 'lotos:scene';
