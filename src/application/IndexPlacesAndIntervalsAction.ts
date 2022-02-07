import type { Interval, Place } from '@/domain/Antibiogram';
import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';

type PlaceAndInterval = [Place, Interval];

class IndexPlacesAndIntervalsAction {
  #repo: AntibiogramRepository;

  constructor(antibiogramRepository: AntibiogramRepository) {
    this.#repo = antibiogramRepository;
  }

  async execute(): Promise<PlaceAndInterval[]> {
    const abgs = await this.#repo.getAll();
    const placesAndIntervals = abgs.map<PlaceAndInterval>((v) => [
      v.place,
      v.interval,
    ]);
    return this.#findUniquePlaceAndInterval(placesAndIntervals);
  }

  #findUniquePlaceAndInterval(arr: PlaceAndInterval[]): PlaceAndInterval[] {
    const seenPlaces: Place[] = [];
    const seenIntervals = new Map<Place, Interval[]>();
    const result: PlaceAndInterval[] = [];

    for (const [p, i] of arr) {
      const seenPlace = seenPlaces.find((v) => p.is(v));
      if (!seenPlace) {
        seenPlaces.push(p);
        seenIntervals.set(p, [i]);
        result.push([p, i]);
      } else {
        const intervals = seenIntervals.get(seenPlace);
        const hasSameInterval = intervals?.find((v) => i.is(v));
        if (hasSameInterval) continue;
        intervals?.push(i);
        result.push([p, i]);
      }
    }

    return result;
  }
}

export default IndexPlacesAndIntervalsAction;
