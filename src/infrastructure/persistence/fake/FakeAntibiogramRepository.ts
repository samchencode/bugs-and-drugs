import type { AntibiogramRepository } from '@/domain/ports/AntibiogramRepository';
import Antibiogram, {
  OrganismValue,
  AntibioticValue,
  SensitivityData,
  SensitivityValue,
  AntibiogramId,
  NullAntibiogram,
} from '@/domain/Antibiogram';

const fakeData: SensitivityData[][] = [
  [
    new SensitivityData({
      organism: new OrganismValue('Klebsiella'),
      antibiotic: new AntibioticValue('Azithromycin'),
      value: new SensitivityValue('100'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Pseudomonas'),
      antibiotic: new AntibioticValue('Azithromycin'),
      value: new SensitivityValue('R'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Staph aureus'),
      antibiotic: new AntibioticValue('Azithromycin'),
      value: new SensitivityValue('90'),
    }),
  ],
  [
    new SensitivityData({
      organism: new OrganismValue('Coluber constrictor'),
      antibiotic: new AntibioticValue('Dates'),
      value: new SensitivityValue('32.729'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Ovis ammon'),
      antibiotic: new AntibioticValue('Dried Apple'),
      value: new SensitivityValue('63.63'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Phoenicopterus ruber'),
      antibiotic: new AntibioticValue('Wonton Wrappers'),
      value: new SensitivityValue('47.478'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Panthera pardus'),
      antibiotic: new AntibioticValue('Soup - Campbells Beef Strogonoff'),
      value: new SensitivityValue('46.647'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Acridotheres tristis'),
      antibiotic: new AntibioticValue('Bread - Rolls, Corn'),
      value: new SensitivityValue('93.341'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Macropus eugenii'),
      antibiotic: new AntibioticValue('Crab - Claws, 26 - 30'),
      value: new SensitivityValue('86.643'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Hyaena hyaena'),
      antibiotic: new AntibioticValue('Wine - Magnotta - Pinot Gris Sr'),
      value: new SensitivityValue('53.915'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Papio ursinus'),
      antibiotic: new AntibioticValue('Coffee - Irish Cream'),
      value: new SensitivityValue('42.595'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Certotrichas paena'),
      antibiotic: new AntibioticValue('Stock - Veal, Brown'),
      value: new SensitivityValue('98.98'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Vombatus ursinus'),
      antibiotic: new AntibioticValue('Canada Dry'),
      value: new SensitivityValue('76.471'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Macropus rufus'),
      antibiotic: new AntibioticValue('Juice - Orangina'),
      value: new SensitivityValue('6.537'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Castor canadensis'),
      antibiotic: new AntibioticValue('Coke - Diet, 355 Ml'),
      value: new SensitivityValue('79.789'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Coluber constrictor'),
      antibiotic: new AntibioticValue('Cheese - Bocconcini'),
      value: new SensitivityValue('81.034'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Tenrec ecaudatus'),
      antibiotic: new AntibioticValue('Veal - Chops, Split, Frenched'),
      value: new SensitivityValue('78.659'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Ammospermophilus nelsoni'),
      antibiotic: new AntibioticValue('Pork - Chop, Frenched'),
      value: new SensitivityValue('54.649'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Chelodina longicollis'),
      antibiotic: new AntibioticValue('Wine - Pinot Noir Latour'),
      value: new SensitivityValue('72.838'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Galago crassicaudataus'),
      antibiotic: new AntibioticValue('Red Currant Jelly'),
      value: new SensitivityValue('16.333'),
    }),
    new SensitivityData({
      organism: new OrganismValue('unavailable'),
      antibiotic: new AntibioticValue('Chocolate - Liqueur Cups With Foil'),
      value: new SensitivityValue('95.392'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Amazona sp.'),
      antibiotic: new AntibioticValue('Ocean Spray - Ruby Red'),
      value: new SensitivityValue('48.491'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Dasypus novemcinctus'),
      antibiotic: new AntibioticValue('Wine - Crozes Hermitage E.'),
      value: new SensitivityValue('3.011'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Naja haje'),
      antibiotic: new AntibioticValue('Wine - Pinot Noir Mondavi Coastal'),
      value: new SensitivityValue('82.734'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Phalaropus lobatus'),
      antibiotic: new AntibioticValue('Haggis'),
      value: new SensitivityValue('83.936'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Papio cynocephalus'),
      antibiotic: new AntibioticValue('Wine - Riesling Dr. Pauly'),
      value: new SensitivityValue('92.074'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Helogale undulata'),
      antibiotic: new AntibioticValue('Sprouts - Onion'),
      value: new SensitivityValue('54.479'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Alligator mississippiensis'),
      antibiotic: new AntibioticValue('Pie Filling - Apple'),
      value: new SensitivityValue('1.837'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Pelecanus conspicillatus'),
      antibiotic: new AntibioticValue('Shrimp - 31/40'),
      value: new SensitivityValue('10.738'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Halcyon smyrnesis'),
      antibiotic: new AntibioticValue('Beef - Cooked, Corned'),
      value: new SensitivityValue('35.297'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Hippotragus niger'),
      antibiotic: new AntibioticValue('Peach - Fresh'),
      value: new SensitivityValue('92.348'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Falco peregrinus'),
      antibiotic: new AntibioticValue('Milkettes - 2%'),
      value: new SensitivityValue('71.429'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Cebus nigrivittatus'),
      antibiotic: new AntibioticValue('Pasta - Elbows, Macaroni, Dry'),
      value: new SensitivityValue('36.607'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Cygnus buccinator'),
      antibiotic: new AntibioticValue('Yucca'),
      value: new SensitivityValue('86.054'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Vulpes vulpes'),
      antibiotic: new AntibioticValue('Bread - Malt'),
      value: new SensitivityValue('24.703'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Anthropoides paradisea'),
      antibiotic: new AntibioticValue('Longos - Cheese Tortellini'),
      value: new SensitivityValue('78.84'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Castor fiber'),
      antibiotic: new AntibioticValue('Rice Paper'),
      value: new SensitivityValue('56.283'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Dasyurus maculatus'),
      antibiotic: new AntibioticValue('Cheese - Gorgonzola'),
      value: new SensitivityValue('65.321'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Genetta genetta'),
      antibiotic: new AntibioticValue('Beer - Upper Canada Lager'),
      value: new SensitivityValue('80.036'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Myrmecophaga tridactyla'),
      antibiotic: new AntibioticValue('Sole - Dover, Whole, Fresh'),
      value: new SensitivityValue('96.351'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Fulica cristata'),
      antibiotic: new AntibioticValue('Onions - Cooking'),
      value: new SensitivityValue('86.534'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Myiarchus tuberculifer'),
      antibiotic: new AntibioticValue('Chutney Sauce'),
      value: new SensitivityValue('60.646'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Galictis vittata'),
      antibiotic: new AntibioticValue('Bread - Mini Hamburger Bun'),
      value: new SensitivityValue('61.327'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Potorous tridactylus'),
      antibiotic: new AntibioticValue('Rum - Coconut, Malibu'),
      value: new SensitivityValue('20.914'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Neotis denhami'),
      antibiotic: new AntibioticValue('Chickhen - Chicken Phyllo'),
      value: new SensitivityValue('96.153'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Oryx gazella'),
      antibiotic: new AntibioticValue('Sorrel - Fresh'),
      value: new SensitivityValue('70.383'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Coluber constrictor'),
      antibiotic: new AntibioticValue('Sole - Dover, Whole, Fresh'),
      value: new SensitivityValue('94.331'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Alligator mississippiensis'),
      antibiotic: new AntibioticValue('Beef - Texas Style Burger'),
      value: new SensitivityValue('25.409'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Gorilla gorilla'),
      antibiotic: new AntibioticValue('Chicken Thigh - Bone Out'),
      value: new SensitivityValue('59.908'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Tachyglossus aculeatus'),
      antibiotic: new AntibioticValue('Pie Shells 10'),
      value: new SensitivityValue('17.87'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Heloderma horridum'),
      antibiotic: new AntibioticValue('Lamb Leg - Bone - In Nz'),
      value: new SensitivityValue('55.23'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Morelia spilotes variegata'),
      antibiotic: new AntibioticValue('Cheese - Comte'),
      value: new SensitivityValue('34.438'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Otaria flavescens'),
      antibiotic: new AntibioticValue('Chocolate Bar - Oh Henry'),
      value: new SensitivityValue('70.387'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Parus atricapillus'),
      antibiotic: new AntibioticValue('Contreau'),
      value: new SensitivityValue('7.157'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Tayassu tajacu'),
      antibiotic: new AntibioticValue('Juice - Happy Planet'),
      value: new SensitivityValue('91.405'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Colaptes campestroides'),
      antibiotic: new AntibioticValue('Soup - Campbells Pasta Fagioli'),
      value: new SensitivityValue('44.218'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Geochelone radiata'),
      antibiotic: new AntibioticValue('Tomatoes - Heirloom'),
      value: new SensitivityValue('39.96'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Cercopithecus aethiops'),
      antibiotic: new AntibioticValue('Trout - Hot Smkd, Dbl Fillet'),
      value: new SensitivityValue('29.5'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Haliaetus leucogaster'),
      antibiotic: new AntibioticValue('Pasta - Elbows, Macaroni, Dry'),
      value: new SensitivityValue('63.938'),
    }),
    new SensitivityData({
      organism: new OrganismValue('unavailable'),
      antibiotic: new AntibioticValue('Tuna - Sushi Grade'),
      value: new SensitivityValue('55.179'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Ratufa indica'),
      antibiotic: new AntibioticValue('Trout - Rainbow, Frozen'),
      value: new SensitivityValue('48.279'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Naja sp.'),
      antibiotic: new AntibioticValue('Cream Of Tartar'),
      value: new SensitivityValue('95.384'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Iguana iguana'),
      antibiotic: new AntibioticValue('Beef Wellington'),
      value: new SensitivityValue('28.439'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Vulpes chama'),
      antibiotic: new AntibioticValue('Bread - Raisin'),
      value: new SensitivityValue('39.228'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Phasianus colchicus'),
      antibiotic: new AntibioticValue('Wine - Red, Marechal Foch'),
      value: new SensitivityValue('13.583'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Merops bullockoides'),
      antibiotic: new AntibioticValue('Limes'),
      value: new SensitivityValue('50.739'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Ceryle rudis'),
      antibiotic: new AntibioticValue('Devonshire Cream'),
      value: new SensitivityValue('41.526'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Pandon haliaetus'),
      antibiotic: new AntibioticValue('Garlic Powder'),
      value: new SensitivityValue('10.409'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Felis wiedi or Leopardus weidi'),
      antibiotic: new AntibioticValue('Tray - 16in Rnd Blk'),
      value: new SensitivityValue('53.312'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Trachyphonus vaillantii'),
      antibiotic: new AntibioticValue('Chocolate - Pistoles, White'),
      value: new SensitivityValue('24.07'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Plegadis ridgwayi'),
      antibiotic: new AntibioticValue('Cup - 4oz Translucent'),
      value: new SensitivityValue('42.784'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Rhabdomys pumilio'),
      antibiotic: new AntibioticValue('Brownies - Two Bite, Chocolate'),
      value: new SensitivityValue('31.277'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Trichosurus vulpecula'),
      antibiotic: new AntibioticValue('V8 Splash Strawberry Banana'),
      value: new SensitivityValue('49.849'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Anser caerulescens'),
      antibiotic: new AntibioticValue('Ice Cream - Life Savers'),
      value: new SensitivityValue('66.368'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Mycteria leucocephala'),
      antibiotic: new AntibioticValue('Crush - Orange, 355ml'),
      value: new SensitivityValue('84.413'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Corallus hortulanus cooki'),
      antibiotic: new AntibioticValue('Tarragon - Primerba, Paste'),
      value: new SensitivityValue('20.629'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Acrantophis madagascariensis'),
      antibiotic: new AntibioticValue('Cookies - Assorted'),
      value: new SensitivityValue('33.212'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Oreamnos americanus'),
      antibiotic: new AntibioticValue('Nut - Almond, Blanched, Sliced'),
      value: new SensitivityValue('89.054'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Mazama gouazoubira'),
      antibiotic: new AntibioticValue('Cod - Salted, Boneless'),
      value: new SensitivityValue('38.604'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Threskionis aethiopicus'),
      antibiotic: new AntibioticValue('Sherbet - Raspberry'),
      value: new SensitivityValue('16.302'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Macropus eugenii'),
      antibiotic: new AntibioticValue('Beans - Butter Lrg Lima'),
      value: new SensitivityValue('76.437'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Isoodon obesulus'),
      antibiotic: new AntibioticValue('Tea - Lemon Green Tea'),
      value: new SensitivityValue('93.018'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Columba livia'),
      antibiotic: new AntibioticValue('Lobster - Baby, Boiled'),
      value: new SensitivityValue('12.75'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Cordylus giganteus'),
      antibiotic: new AntibioticValue('Monkfish Fresh - Skin Off'),
      value: new SensitivityValue('47.639'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Anas bahamensis'),
      antibiotic: new AntibioticValue('Potatoes - Fingerling 4 Oz'),
      value: new SensitivityValue('21.31'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Cygnus buccinator'),
      antibiotic: new AntibioticValue('Glaze - Clear'),
      value: new SensitivityValue('32.894'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Thalasseus maximus'),
      antibiotic: new AntibioticValue('Shopper Bag - S - 4'),
      value: new SensitivityValue('97.141'),
    }),
    new SensitivityData({
      organism: new OrganismValue('unavailable'),
      antibiotic: new AntibioticValue('Cloves - Ground'),
      value: new SensitivityValue('32.102'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Callorhinus ursinus'),
      antibiotic: new AntibioticValue('Irish Cream - Butterscotch'),
      value: new SensitivityValue('56.887'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Felis concolor'),
      antibiotic: new AntibioticValue('Red Pepper Paste'),
      value: new SensitivityValue('85.233'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Anathana ellioti'),
      antibiotic: new AntibioticValue('Saskatoon Berries - Frozen'),
      value: new SensitivityValue('7.749'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Cebus apella'),
      antibiotic: new AntibioticValue('Bread - Italian Roll With Herbs'),
      value: new SensitivityValue('54.476'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Ara chloroptera'),
      antibiotic: new AntibioticValue('Sambuca - Ramazzotti'),
      value: new SensitivityValue('91.74'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Bassariscus astutus'),
      antibiotic: new AntibioticValue('Extract - Vanilla,artificial'),
      value: new SensitivityValue('34.718'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Odocoilenaus virginianus'),
      antibiotic: new AntibioticValue('Pasta - Lasagne, Fresh'),
      value: new SensitivityValue('65.092'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Camelus dromedarius'),
      antibiotic: new AntibioticValue('Loaf Pan - 2 Lb, Foil'),
      value: new SensitivityValue('67.287'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Anas punctata'),
      antibiotic: new AntibioticValue('Ocean Spray - Ruby Red'),
      value: new SensitivityValue('5.967'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Corallus hortulanus cooki'),
      antibiotic: new AntibioticValue('Radish - Black, Winter, Organic'),
      value: new SensitivityValue('37.316'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Himantopus himantopus'),
      antibiotic: new AntibioticValue('Pork - Sausage, Medium'),
      value: new SensitivityValue('63.72'),
    }),
    new SensitivityData({
      organism: new OrganismValue('unavailable'),
      antibiotic: new AntibioticValue('Jolt Cola - Electric Blue'),
      value: new SensitivityValue('25.378'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Papio ursinus'),
      antibiotic: new AntibioticValue('Tobasco Sauce'),
      value: new SensitivityValue('7.935'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Upupa epops'),
      antibiotic: new AntibioticValue('Bread - Crumbs, Bulk'),
      value: new SensitivityValue('95.019'),
    }),
    new SensitivityData({
      organism: new OrganismValue('Semnopithecus entellus'),
      antibiotic: new AntibioticValue('Ice Cream Bar - Oreo Sandwich'),
      value: new SensitivityValue('47.354'),
    }),
  ],
];

const fakeAntibiograms = [
  new Antibiogram(new AntibiogramId('0'), fakeData[0]),
  new Antibiogram(new AntibiogramId('1'), fakeData[1]),
];

class FakeAntibiogramRepository implements AntibiogramRepository {
  async getById(id: AntibiogramId): Promise<Antibiogram> {
    const match = fakeAntibiograms.find((abg) => abg.id.is(id));
    return match ?? new NullAntibiogram();
  }

  async getAll(): Promise<Antibiogram[]> {
    return fakeAntibiograms;
  }

  static data = fakeData;
}

export default FakeAntibiogramRepository;
