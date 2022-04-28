import {
  AntibiogramId,
  GramValues,
  IntegerNumberOfIsolates,
  Interval,
  Metadata,
  OrganismValue,
  Place,
  Routes,
  SampleInfo,
  SensitivityValue,
  SingleAntibioticValue,
  Sources,
  UnknownNumberOfIsolates,
} from '@/domain/Antibiogram';
import type { File } from '@/infrastructure/filesystem/File';
import type { FileSystem } from '@/infrastructure/filesystem/FileSystem';
import FileAntibiogramRepository from '@/infrastructure/persistence/file/FileAntibiogramRepository';

describe('CsvAntibiogramRepository', () => {
  const fakeFileFactory: (
    csvs: Record<string, string>
  ) => (path: string) => File = (csvs) => (path) => ({
    getContents: jest.fn().mockResolvedValue(csvs[path]),
  });

  const fakeFileSystem: (f: (path: string) => File) => FileSystem = (
    fileFactory
  ) => ({
    getFile: jest.fn(),
    getDataFile: jest.fn().mockImplementation((path) => fileFactory(path)),
  });

  describe('instantiation', () => {
    it('should be created with atlas data', () => {
      const fs = fakeFileSystem(
        fakeFileFactory({
          'atlas.csv':
            'region,institution,year_month_start,year_month_end,antibiogram_id,sample_info,gram,csv\n' +
            'Gotham City,Hospital,202001,202101,1,#N/A,positive,1.csv\n',
        })
      );

      const repo = new FileAntibiogramRepository(fs);
      expect(repo).toBeDefined();
    });
  });

  describe('behavior', () => {
    let repo: FileAntibiogramRepository;

    const fs = fakeFileSystem(
      fakeFileFactory({
        'atlas.csv':
          'region,institution,year_month_start,year_month_end,antibiogram_id,sample_info,gram,csv,metadata\n' +
          'Gotham City,Hospital,202001,202101,1,#N/A,positive,1.csv,meta.json\n' +
          'Gotham City,Hospital,202001,202101,2,#N/A,negative,2.csv,\n',
        '1.csv':
          'organism_name,antibiotic_name,antibiotic_route,isolates,value,sample_info\n' +
          'Rhea americana,nelfinavir mesylate,#N/A,919,90,urine\n' +
          'Diomedea irrorata,"Titanium Dioxide, Zinc Oxide",IV,,48,"inpatient,urine"\n' +
          'Camelus dromedarius,Ferrum sidereum 21 Special Order,IV/PO,59,41,non-urine\n' +
          'Nyctereutes procyonoides,"Arsenicum album, Arsenicum iodatum, Baryta carbonica, Calcarea carbonica, Carbo animalis, Kreosotum, Lachesis mutus, Phosphorus, Silicea",#N/A,418,96,urine\n' +
          'Acinynox jubatus,metformin hydrochloride,#N/A,365,1,non-urine\n' +
          'Pseudocheirus peregrinus,cabozantinib,IV/PO,432,91,non-urine\n' +
          'Picoides pubescens,TRICLOSAN,#N/A,981,67,"inpatient,urine"\n' +
          'Libellula quadrimaculata,acyclovir,#N/A,,56,"inpatient,urine"\n' +
          'Macaca nemestrina,isocarboxazid,IV/PO,633,95,non-urine\n' +
          'Corvus albicollis,Etodolac,#N/A,154,14,"outpatient,urine"\n' +
          'Lemur fulvus,"Bacitracin Zinc, Neomycin Sulfate and Polymyxin B Sulfate",IV/PO,,29,non-urine\n' +
          'Junonia genoveua,"OCTINOXATE, OXYBENZONE",#N/A,719,4,"inpatient,urine"\n' +
          'Morelia spilotes variegata,"AVOBENZONE,OCTINOXATE,OXYBENZONE,PADIMATE",#N/A,,64,urine\n' +
          'Crocuta crocuta,Irinotecan,#N/A,925,44,non-urine\n' +
          'Geococcyx californianus,Lidocaine Hydrochloride,#N/A,821,35,non-urine\n' +
          'Haematopus ater,HYDROCORTISONE ACETATE,#N/A,821,5,"outpatient,urine"\n' +
          'Castor fiber,MENTHOL,PO,411,8,non-urine\n' +
          'Mellivora capensis,isopropyl alcohol,#N/A,661,21,urine\n' +
          'Ictonyx striatus,pramoxine hydrochloride,IV/PO,911,43,"outpatient,urine"\n' +
          'Alligator mississippiensis,Timolol Maleate,#N/A,824,27,non-urine\n', // with trailing new-line
        '2.csv':
          'organism_name,antibiotic_name,antibiotic_route,isolates,value,sample_info\n' +
          'Seiurus aurocapillus,Metformin Hydrochloride,IV,137,51,urine\n' +
          'Echimys chrysurus,CIPROFLOXACIN,IV/PO,237,78,urine\n' +
          'Colobus guerza,Amitriptyline Hydrochloride,#N/A,,34,#N/A\n' +
          'Ictonyx striatus,"citric acid, gluconolactone and magnesium carbonate",#N/A,130,11,"inpatient,urine"\n' +
          'Coracias caudata,"CROTON TIGLIUM, ALUMINA, ARGENTUM NITRICUM, PODOPHYLLUM PELTATUM, MAGNESIA CARBONICA",PO,617,25,"outpatient,non-urine"\n' +
          'Canis lupus baileyi,STANNUM METALLICUM,#N/A,290,31,"outpatient,urine"\n' +
          'Ara ararauna,California Black Oak,IV/PO,,81,#N/A\n' +
          'Macropus eugenii,METHADONE HYDROCHLORIDE,#N/A,,46,"outpatient,urine"\n' +
          'Limosa haemastica,benazepril hydrochloride and hydrochlorothiazide,IV,575,18,"outpatient,non-urine"\n' +
          'Chlamydosaurus kingii,"TITANIUM DIOXIDE, ZINC OXIDE",#N/A,188,4,non-urine\n' +
          'Larus fuliginosus,Salicylic Acid,#N/A,559,25,"outpatient,non-urine"\n' +
          'Nectarinia chalybea,Alcohol,#N/A,874,11,"inpatient,urine"\n' +
          'Ratufa indica,Hydrogen Peroxide,IV/PO,,35,"outpatient,urine"\n' +
          'Buteo galapagoensis,Famciclovir,#N/A,258,40,non-urine\n' +
          'Ardea golieth,"Titanium Dioxide, Ethylhexyl Methoxycinnamate, Ethylhexyl Salicylate, Zinc Oxide",#N/A,514,29,non-urine\n' +
          'Oryx gazella,Pectin,#N/A,63,3,non-urine\n' +
          'Butorides striatus,Torsemide,PO,938,69,non-urine\n' +
          'Phalacrocorax albiventer,OXYMETAZOLINE HYDROCHLORIDE,IV,200,69,non-urine\n' +
          'Climacteris melanura,ondansetron hydrochloride,IV,512,49,"inpatient,urine"\n' +
          'Perameles nasuta,Sodium fluoride,#N/A,340,14,"inpatient,urine"', // without trailing new-line,
        'meta.json': '{"footnotes":["hello world"]}',
      })
    );

    async function getId(id: string) {
      return await repo.getById(new AntibiogramId(id));
    }

    async function getBoth() {
      return await Promise.all([getId('1'), getId('2')]);
    }

    beforeEach(() => (repo = new FileAntibiogramRepository(fs)));

    it('should parse csv and create antibiogram with proper data', () =>
      getBoth().then(([abg1, abg2]) => {
        expect(abg1).toBeDefined();

        const data1 = abg1.getSensitivities();
        expect(data1.length).toBe(20);
        const sd1 = data1.find((d) =>
          d.getOrganism().is(new OrganismValue('Ictonyx striatus'))
        );
        expect(sd1?.getIsolates().is(new IntegerNumberOfIsolates(911))).toBe(
          true
        );
        expect(sd1?.getValue().is(new SensitivityValue('43'))).toBe(true);
        const data2 = abg2.getSensitivities();
        expect(data2.length).toBe(20);
        const sd2 = data2.find((d) =>
          d.getOrganism().is(new OrganismValue('Seiurus aurocapillus'))
        );
        expect(
          sd2
            ?.getAntibiotic()
            .is(new SingleAntibioticValue('Metformin Hydrochloride', Routes.IV))
        ).toBe(true);
        expect(sd2?.getSampleInfo().is(new SampleInfo([Sources.URINE])));
        const sd3 = data1.find((d) =>
          d.getOrganism().is(new OrganismValue('Libellula quadrimaculata'))
        );
        expect(sd3?.getIsolates()).toBeInstanceOf(UnknownNumberOfIsolates);
        expect(
          sd3?.getAntibiotic().getAntibiotics()[0].getRoute().is(Routes.UNKNOWN)
        ).toBe(true);
      }));

    it('should parse csv and create antibiogram with proper metadata', () =>
      getBoth().then(([abg1, abg2]) => {
        const {
          info: info1,
          gram: gram1,
          place: place1,
          interval: interval1,
        } = abg1;
        expect(gram1.is(GramValues.POSITIVE)).toBe(true);
        expect(info1.is(new SampleInfo([]))).toBe(true);
        expect(place1.is(new Place('Gotham City', 'Hospital'))).toBe(true);
        expect(
          interval1.is(new Interval(new Date(2020, 0), new Date(2021, 0)))
        ).toBe(true);

        const {
          info: info2,
          gram: gram2,
          place: place2,
          interval: interval2,
        } = abg2;
        expect(gram2.is(GramValues.NEGATIVE)).toBe(true);
        expect(info2.is(new SampleInfo([]))).toBe(true);
        expect(place2.is(new Place('Gotham City', 'Hospital'))).toBe(true);
        expect(
          interval2.is(new Interval(new Date(2020, 0), new Date(2021, 0)))
        ).toBe(true);
      }));

    it('should load all antibiograms', () =>
      repo.getAll().then((abgs) => {
        expect(abgs[0].id.is(new AntibiogramId('1'))).toBe(true);
        expect(abgs[1].id.is(new AntibiogramId('2'))).toBe(true);
      }));

    it('should load the metadata file when it exists', () =>
      repo.getAll().then(([abg1, abg2]) => {
        expect(abg1.metadata.is(new Metadata([]))).toBe(false);
        expect(abg1.metadata.get('footnotes')?.getValue()).toEqual([
          'hello world',
        ]);
        expect(abg2.metadata.is(new Metadata([]))).toBe(true);
      }));
  });
});
