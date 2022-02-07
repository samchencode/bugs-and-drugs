import type Antibiogram from '@/domain/Antibiogram';
import type { Interval, Place } from '@/domain/Antibiogram';
import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';

class FindAntibiogramsByPlaceAndIntervalAction {
  #repo: AntibiogramRepository;

  constructor(antibiogramRepository: AntibiogramRepository) {
    this.#repo = antibiogramRepository;
  }

  async execute(place: Place, interval: Interval): Promise<Antibiogram[]> {
    const abgs = await this.#repo.getAll();
    return abgs.filter((v) => v.place.is(place) && v.interval.is(interval));
  }
}

export default FindAntibiogramsByPlaceAndIntervalAction;
