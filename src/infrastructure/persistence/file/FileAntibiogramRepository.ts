import Antibiogram, {
  type AntibiogramId,
  SensitivityData,
} from '@/domain/Antibiogram';
import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import type { FileSystem } from '@/infrastructure/filesystem/FileSystem';
import type {
  AtlasRow,
  AtlasRowArray,
} from '@/infrastructure/persistence/file/AtlasCsv';
import AtlasCsv from '@/infrastructure/persistence/file/AtlasCsv';
import DataCsv from '@/infrastructure/persistence/file/DataCsv';
import * as f from '@/infrastructure/persistence/file/antibiogramAttributeFactories';
import type { MetadataJson } from '@/infrastructure/persistence/file/MetadataJson';

class FileAntibiogramRepository implements AntibiogramRepository {
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
    return this.#getByAtlasRow(meta);
  }

  async getAll(): Promise<Antibiogram[]> {
    if (!this.#atlas) this.#atlas = await this.#loadAtlas();
    return Promise.all(this.#atlas.map((meta) => this.#getByAtlasRow(meta)));
  }

  async #getByAtlasRow(atlasRow: AtlasRow) {
    const csv = await this.#fs.getDataFile(atlasRow['csv']).getContents();
    const metadata =
      atlasRow['metadata'] &&
      (JSON.parse(
        await this.#fs.getDataFile(atlasRow['metadata']).getContents()
      ) as MetadataJson);
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
    const id = f.id(atlasRow['antibiogram_id']);

    return new Antibiogram(id, data, {
      info: atlasRow['sample_info']
        ? f.info(atlasRow['sample_info'])
        : undefined,
      gram: atlasRow['gram'] ? f.gram(atlasRow['gram']) : undefined,
      place:
        atlasRow['region'] && atlasRow['institution']
          ? f.place(atlasRow['region'], atlasRow['institution'])
          : undefined,
      interval:
        atlasRow['year_month_start'] && atlasRow['year_month_end']
          ? f.interval(atlasRow['year_month_start'], atlasRow['year_month_end'])
          : undefined,
      metadata: metadata ? f.metadata(metadata) : undefined,
    });
  }
}

export default FileAntibiogramRepository;
