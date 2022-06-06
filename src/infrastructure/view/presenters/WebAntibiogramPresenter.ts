import { SampleInfo } from '@/domain/Antibiogram';
import type Antibiogram from '@/domain/Antibiogram';
import type {
  AntibiogramData,
  AntibiogramPresenter,
} from '@/domain/ports/AntibiogramPresenter';
import type { WebTable } from '@/infrastructure/view/presenters/WebTablePresenter';
import type WebTablePresenter from '@/infrastructure/view/presenters/WebTablePresenter';
import WebResistanceRate from '@/infrastructure/view/presenters/WebResistanceRate';

type WebAntibiogram = {
  table: WebTable;
  antibiogramId: string;
  region: string;
  institution: string;
  publishedAt: string;
  expiresAt: string;
  gram: string;
  info: string;
  footnotes: string[];
  resistanceRates: WebResistanceRate[];
};

class WebAntibiogramPresenter implements AntibiogramPresenter {
  #tablePresenter: WebTablePresenter;
  #abg: Antibiogram | null = null;

  constructor(webTablePresenter: WebTablePresenter) {
    this.#tablePresenter = webTablePresenter;
  }

  setData(data: AntibiogramData): void {
    this.#tablePresenter.setData(data.table);
    this.#abg = data.antibiogram;
  }

  buildViewModel(): WebAntibiogram | null {
    const table = this.#tablePresenter.buildViewModel();
    if (!this.#abg || !table) return null;
    return {
      table,
      antibiogramId: this.#abg.id.getValue(),
      region: this.#abg.place.getState(),
      institution: this.#abg.place.getInstitution(),
      publishedAt: this.#abg.interval.publishedAtToString(),
      expiresAt: this.#abg.interval.expiresAtToString(),
      gram: this.#abg.gram.toString(),
      info: this.#makeSampleInfoString(this.#abg.info),
      footnotes: this.#abg.metadata.getFootnotes().getValue(),
      resistanceRates: this.#abg.metadata
        .getResistanceRates()
        .getResistanceRates()
        .map((resistanceRate) => {
          console.log(resistanceRate.getRate().getValue().toString());
          return new WebResistanceRate(
            resistanceRate.getlabel(),
            resistanceRate.getRate().getValue().toString(),
            resistanceRate.getYear()
          );
        }),
    };
  }

  #makeSampleInfoString(info: SampleInfo) {
    return !info.is(new SampleInfo([])) ? info.toString() : 'Antibiogram';
  }
}

export default WebAntibiogramPresenter;
export type { WebAntibiogram };
