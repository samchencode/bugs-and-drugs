import type { Interval, Place } from '@/domain/Antibiogram';

interface AntibiogramGroup {
  place: Place;
  interval: Interval;
}

interface AntibiogramGroupPresenter {
  setData(data: AntibiogramGroup[]): void;
}

export type { AntibiogramGroupPresenter, AntibiogramGroup };
