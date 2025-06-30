const scrollPositions = new Map<string, number>();

export const saveScroll = (key: string) => {
  scrollPositions.set(key, window.scrollY);
};

export const restoreScroll = (key: string) => {
  const y = scrollPositions.get(key);
  if (typeof y === 'number') {
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
};