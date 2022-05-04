class SortBehavior {
  #mapping: number[];

  constructor(newOrder: string[], originalOrder: string[]) {
    this.#mapping = originalOrder
      .slice()
      .sort((o1, o2) => {
        const idx1 = newOrder.indexOf(o1);
        const idx2 = newOrder.indexOf(o2);
        if (idx1 < 0) return 1;
        if (idx2 < 0) return -1;
        return idx1 - idx2;
      })
      .map((l) => originalOrder.indexOf(l));
  }

  arrange<T>(arr: T[]): T[] {
    const { length } = arr;
    return new Array(length)
      .fill(undefined)
      .map((_, i) => arr[this.#mapping[i]]);
  }

  arrangeColumns<T>(mat: T[][]): T[][] {
    return mat.map((r) => this.arrange(r));
  }
}

export default SortBehavior;
