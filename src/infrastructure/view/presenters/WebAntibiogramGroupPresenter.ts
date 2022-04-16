import type Antibiogram from '@/domain/Antibiogram';
import type ValueObject from '@/domain/base/ValueObject';
import type { AntibiogramPresenter } from '@/domain/ports/AntibiogramGroupPresenter';

type WebAntibiogramGroup = {
  place: string;
  intervals:
    | {
        interval: string;
        groups: {
          title: string;
          antibiograms: {
            gram: string;
            id: string;
          }[];
        }[];
      }[];
};

class WebAntibiogramGroupPresenter implements AntibiogramPresenter {
  #data: Antibiogram[] | null = null;

  setData(data: Antibiogram[]): void {
    this.#data = data;
  }

  buildViewModel(): WebAntibiogramGroup[] | null {
    if (this.#data === null) return null;
    const data = this.#data;

    const places = this.#group((d) => d.place, data);
    const result = places.map(([place, data]) => ({
      place: place.toString(),
      intervals: this.#group((d) => d.interval, data).map(
        ([interval, data]) => ({
          interval: interval.toString(),
          groups: this.#group((d) => d.info, data).map(([si, data]) => ({
            title: si.toString(),
            antibiograms: data.map((abg) => ({
              gram: abg.gram.toString(),
              id: abg.id.getValue(),
            })),
          })),
        })
      ),
    }));

    return result;
  }

  #group<T extends ValueObject, S>(
    accessor: (v: S) => T,
    arr: S[]
  ): [T, S[]][] {
    const uq = this.#findUnique(accessor, arr);
    const map = new Map<T, S[]>();
    for (const item of uq) {
      const ingroup = arr.filter((v) => accessor(v).is(item));
      map.set(item, ingroup);
    }
    return Array.from(map.entries());
  }

  #findUnique<T extends ValueObject, S>(accessor: (v: S) => T, arr: S[]): T[] {
    const seen: T[] = [];
    for (const item of arr.map((v) => accessor(v))) {
      if (seen.find((p) => p.is(item))) continue;
      seen.push(item);
    }
    return seen;
  }
}

export default WebAntibiogramGroupPresenter;
export type { WebAntibiogramGroup };
