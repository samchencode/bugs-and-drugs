class SortBehavior {
  #mapping: number[];

  constructor(newOrder: string[], originalOrder: string[]) {
    const r = this.#escapeRegExp;

    this.#mapping = originalOrder
      .slice()
      .sort((o1, o2) => {
        const idx1 = newOrder.findIndex((o) => o1.match(r(o)));
        const idx2 = newOrder.findIndex((o) => o2.match(r(o)));
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

  #escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default SortBehavior;
