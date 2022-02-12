import Antibiogram, {
  type AntibiogramId,
  SensitivityData,
} from '@/domain/Antibiogram';
import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import type { FileSystem } from '@/infrastructure/filesystem/FileSystem';
import type {
  AtlasRow,
  AtlasRowArray,
} from '@/infrastructure/persistence/csv/AtlasCsv';
import AtlasCsv from '@/infrastructure/persistence/csv/AtlasCsv';
import DataCsv from '@/infrastructure/persistence/csv/DataCsv';
import * as f from '@/infrastructure/persistence/csv/antibiogramAttributeFactories';

class CsvAntibiogramRepository implements AntibiogramRepository {
  #fs: FileSystem;
  #atlas: AtlasRowArray | null = null;

  constructor(filesystem: FileSystem) {
    this.#fs = filesystem;
  }

  async #loadAtlas() {
    const csv = await this.#fs.getDataFile('atlas.csv').getContents();
    return await new AtlasCsv(csv).parse();
  }

  async getById(id: AntibiogramId): Promise<Antibiogram> {
    if (!this.#atlas) this.#atlas = await this.#loadAtlas();
    const meta = this.#atlas.find((row) => {
      const abgId = f.id(row['antibiogram_id']);
      return id.is(abgId);
    });
    if (!meta)
      throw new Error('Unable to find antibiogram with id of ' + id.getValue());
    return this.#getByMeta(meta);
  }

  async getAll(): Promise<Antibiogram[]> {
    if (!this.#atlas) this.#atlas = await this.#loadAtlas();
    return Promise.all(this.#atlas.map((meta) => this.#getByMeta(meta)));
  }

  async #getByMeta(meta: AtlasRow) {
    const csv = await this.#fs.getDataFile(meta['csv']).getContents();
    const data = new DataCsv(csv).parse().map(
      (r) =>
        new SensitivityData({
          organism: f.org(r['organism_name']),
          antibiotic: f.abx(
            r['antibiotic_name'],
            r['antibiotic_route'] ? f.route(r['antibiotic_route']) : undefined
          ),
          value: f.value(r['value']),
          isolates: r['isolates'] ? f.iso(r['isolates']) : undefined,
          sampleInfo: r['sample_info'] ? f.info(r['sample_info']) : undefined,
        })
    );
    const id = f.id(meta['antibiogram_id']);

    return new Antibiogram(id, data, {
      info: meta['sample_info'] ? f.info(meta['sample_info']) : undefined,
      gram: meta['gram'] ? f.gram(meta['gram']) : undefined,
      place:
        meta['region'] && meta['institution']
          ? f.place(meta['region'], meta['institution'])
          : undefined,
      interval:
        meta['year_month_start'] && meta['year_month_end']
          ? f.interval(meta['year_month_start'], meta['year_month_end'])
          : undefined,
    });
  }
}

export default CsvAntibiogramRepository;
