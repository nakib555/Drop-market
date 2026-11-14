import productLoungeChairImg from '../assets/images/product_lounge_chair_1794631819996.jpg';
import productBrassLampImg from '../assets/images/product_brass_lamp_1794631822181.jpg';
import productTravertineTableImg from '../assets/images/product_travertine_table_1794631821019.jpg';
import productCeramicVesselImg from '../assets/images/product_ceramic_vessel_1794631820995.jpg';
import productPendantLightImg from '../assets/images/product_pendant_light_1794631821090.jpg';
import productWalnutCredenzaImg from '../assets/images/product_walnut_credenza_1794631821822.jpg';
import productMerinoThrowImg from '../assets/images/product_merino_throw_1794631822019.jpg';
import productDeskClockImg from '../assets/images/product_desk_clock_1794631822843.jpg';
import productGlassCarafeImg from '../assets/images/product_glass_carafe_1794631822433.jpg';
import productDiningChairImg from '../assets/images/product_dining_chair_1794631822749.jpg';
import productStudioHeadphonesImg from '../assets/images/product_studio_headphones_1794633333989.jpg';
import productWirelessSpeakerImg from '../assets/images/product_wireless_speaker_1794633334442.jpg';
import productMerinoOvershirtImg from '../assets/images/product_merino_overshirt_1794633334532.jpg';
import productBotanicalSerumImg from '../assets/images/product_botanical_serum_1794633335623.jpg';
import productOutdoorDaypackImg from '../assets/images/product_outdoor_daypack_1794633335664.jpg';
import productCoffeePouroverImg from '../assets/images/product_coffee_pourover_1794633336545.jpg';
import productLaptopSmartphoneImg from '../assets/images/product_laptop_smartphone_1794634363377.jpg';
import productRunningSneakersImg from '../assets/images/product_running_sneakers_1794634363478.jpg';
import productHardcoverBooksImg from '../assets/images/product_hardcover_books_1794634364361.jpg';
import productWoodenInstrumentImg from '../assets/images/product_wooden_instrument_toy_1794634364495.jpg';
import productAutoDashcamImg from '../assets/images/product_auto_dashcam_kit_1794634364511.jpg';
import productIndustrialToolsImg from '../assets/images/product_industrial_tools_kit_1794640604761.jpg';
import productBabyNurseryImg from '../assets/images/product_baby_kids_nursery_set_1794640604680.jpg';
import productHealthPetsImg from '../assets/images/product_health_wellness_pets_1794640605047.jpg';

export const IMAGE_PRESET_OPTIONS = [
  { key: 'headphones', label: 'Studio Audio Headphones' },
  { key: 'speaker', label: 'Acoustic Hi-Fi Speaker' },
  { key: 'workstation', label: 'Dual-Device Aluminum Desk Dock' },
  { key: 'dashcam', label: '4K Aluminum Dashcam Kit' },
  { key: 'tools', label: 'Brushless Drill & Titanium Bit Kit' },
  { key: 'overshirt', label: 'Tailored Merino Apparel' },
  { key: 'sneakers', label: 'Knit Trail & Road Sneakers' },
  { key: 'serum', label: 'Botanical Skincare Glass' },
  { key: 'coffee', label: 'Pour-Over & Gourmet Pantry' },
  { key: 'daypack', label: 'Weatherproof Outdoor Pack' },
  { key: 'chair', label: 'Sculptural Oak Seating' },
  { key: 'dining', label: 'Steam-Bent Dining Chair' },
  { key: 'table', label: 'Honed Travertine Table' },
  { key: 'credenza', label: 'Fluted Walnut Credenza' },
  { key: 'lamp', label: 'Unlacquered Brass Lamp' },
  { key: 'pendant', label: 'Opal Glass Linear Pendant' },
  { key: 'vessel', label: 'Wheel-Thrown Stoneware Vessel' },
  { key: 'throw', label: 'Merino Herringbone Throw' },
  { key: 'clock', label: 'Milled Bronze Desk Instrument' },
  { key: 'carafe', label: 'Borosilicate Tableware' },
  { key: 'books', label: 'Hardcover Studio Monographs' },
  { key: 'instrument', label: 'Solid Beech Acoustic Instrument' },
  { key: 'nursery', label: 'Organic Muslin & Montessori Nursery' },
  { key: 'healthpets', label: 'Daily Supplements & Pet Bowls' },
] as const;

export type ImagePresetKey = (typeof IMAGE_PRESET_OPTIONS)[number]['key'];

const PRESET_MAP: Record<string, string> = {
  headphones: productStudioHeadphonesImg,
  speaker: productWirelessSpeakerImg,
  workstation: productLaptopSmartphoneImg,
  dashcam: productAutoDashcamImg,
  tools: productIndustrialToolsImg,
  overshirt: productMerinoOvershirtImg,
  sneakers: productRunningSneakersImg,
  serum: productBotanicalSerumImg,
  coffee: productCoffeePouroverImg,
  daypack: productOutdoorDaypackImg,
  chair: productLoungeChairImg,
  dining: productDiningChairImg,
  lamp: productBrassLampImg,
  table: productTravertineTableImg,
  vessel: productCeramicVesselImg,
  pendant: productPendantLightImg,
  credenza: productWalnutCredenzaImg,
  throw: productMerinoThrowImg,
  clock: productDeskClockImg,
  carafe: productGlassCarafeImg,
  books: productHardcoverBooksImg,
  instrument: productWoodenInstrumentImg,
  nursery: productBabyNurseryImg,
  healthpets: productHealthPetsImg,
};

const CATEGORY_FALLBACK_KEY: Record<string, string> = {
  'electronics-tech': 'headphones',
  'fashion-accessories': 'overshirt',
  'home-furniture-kitchen': 'chair',
  'beauty-care': 'serum',
  'grocery-food-household': 'coffee',
  'sports-outdoors-travel': 'daypack',
  'books-stationery-office': 'books',
  'automotive-tools-industrial': 'tools',
  'baby-kids-toys-hobbies': 'nursery',
  'health-wellness-pets': 'healthpets',
  // Legacy slugs fallback
  'fashion-apparel': 'overshirt',
  'home-living': 'chair',
  'grocery-food': 'coffee',
  'sports-outdoor': 'daypack',
  'books-office': 'books',
  'toys-entertainment': 'instrument',
};

export function resolveImagePreset(key?: string, categorySlug?: string): string {
  if (key && PRESET_MAP[key]) return PRESET_MAP[key];
  if (categorySlug && CATEGORY_FALLBACK_KEY[categorySlug]) {
    return PRESET_MAP[CATEGORY_FALLBACK_KEY[categorySlug]];
  }
  return productStudioHeadphonesImg;
}
