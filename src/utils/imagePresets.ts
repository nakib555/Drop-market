import productLoungeChairImg from '../assets/images/product_lounge_chair_1794631819996.jpg';
import productBrassLampImg from '../assets/images/product_brass_lamp_1794631822181.jpg';
import productTravertineTableImg from '../assets/images/product_travertine_table_1794631821019.jpg';
import productCeramicVesselImg from '../assets/images/product_ceramic_vessel_1794631820995.jpg';
import productPendantLightImg from '../assets/images/product_pendant_light_1794631821090.jpg';
import productWalnutCredenzaImg from '../assets/images/product_walnut_credenza_1794631821822.jpg';
import productMerinoThrowImg from '../assets/images/product_merino_throw_1794631822019.jpg';
import productDeskClockImg from '../assets/images/product_desk_clock_1794631822843.jpg';
import productGlassCarafeImg from '../assets/images/product_glass_carafe_1794631822433.jpg';
import productStudioHeadphonesImg from '../assets/images/product_studio_headphones_1794633333989.jpg';
import productWirelessSpeakerImg from '../assets/images/product_wireless_speaker_1794633334442.jpg';
import productMerinoOvershirtImg from '../assets/images/product_merino_overshirt_1794633334532.jpg';
import productBotanicalSerumImg from '../assets/images/product_botanical_serum_1794633335623.jpg';
import productOutdoorDaypackImg from '../assets/images/product_outdoor_daypack_1794633335664.jpg';
import productCoffeePouroverImg from '../assets/images/product_coffee_pourover_1794633336545.jpg';

export const IMAGE_PRESET_OPTIONS = [
  { key: 'headphones', label: 'Studio Audio Headphones' },
  { key: 'speaker', label: 'Acoustic Hi-Fi Speaker' },
  { key: 'overshirt', label: 'Tailored Merino Apparel' },
  { key: 'serum', label: 'Botanical Skincare Glass' },
  { key: 'coffee', label: 'Pour-Over & Gourmet Pantry' },
  { key: 'daypack', label: 'Weatherproof Outdoor Pack' },
  { key: 'chair', label: 'Sculptural Oak Seating' },
  { key: 'lamp', label: 'Unlacquered Brass Lamp' },
  { key: 'clock', label: 'Milled Bronze Desk Instrument' },
  { key: 'carafe', label: 'Borosilicate Tableware' },
] as const;

export type ImagePresetKey = (typeof IMAGE_PRESET_OPTIONS)[number]['key'];

const PRESET_MAP: Record<string, string> = {
  headphones: productStudioHeadphonesImg,
  speaker: productWirelessSpeakerImg,
  overshirt: productMerinoOvershirtImg,
  serum: productBotanicalSerumImg,
  coffee: productCoffeePouroverImg,
  daypack: productOutdoorDaypackImg,
  chair: productLoungeChairImg,
  lamp: productBrassLampImg,
  table: productTravertineTableImg,
  vessel: productCeramicVesselImg,
  pendant: productPendantLightImg,
  credenza: productWalnutCredenzaImg,
  throw: productMerinoThrowImg,
  clock: productDeskClockImg,
  carafe: productGlassCarafeImg,
};

const CATEGORY_FALLBACK_KEY: Record<string, string> = {
  'electronics-tech': 'headphones',
  'fashion-apparel': 'overshirt',
  'home-living': 'chair',
  'beauty-care': 'serum',
  'grocery-food': 'coffee',
  'sports-outdoor': 'daypack',
  'books-office': 'clock',
  'toys-entertainment': 'speaker',
};

export function resolveImagePreset(key?: string, categorySlug?: string): string {
  if (key && PRESET_MAP[key]) return PRESET_MAP[key];
  if (categorySlug && CATEGORY_FALLBACK_KEY[categorySlug]) {
    return PRESET_MAP[CATEGORY_FALLBACK_KEY[categorySlug]];
  }
  return productStudioHeadphonesImg;
}
