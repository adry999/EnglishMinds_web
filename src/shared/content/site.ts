import { AGE_GROUPS, type AgeGroup } from '@shared/contracts/age-groups';

export { AGE_GROUPS, type AgeGroup };

export type PhotoKey = 'class' | 'hands' | 'group' | 'boyReading' | 'teacherEma' | 'emaReading';
export type LevelSlug = 'starters' | 'pre-a1' | 'movers' | 'flyers' | 'a2-key';

export type ValueCard = {
  readonly title: string;
  readonly text: string;
  readonly tone: 'navy' | 'orange' | 'sun';
};

export type CampSlot = {
  readonly time: string;
  readonly title: string;
  readonly text: string;
};

export type Level = {
  readonly slug: LevelSlug;
  readonly name: string;
  readonly ageGroup: AgeGroup;
  readonly summary: string;
  readonly description: string;
  readonly outcomes: readonly string[];
  readonly photo: PhotoKey;
};

export type FaqEntry = {
  readonly question: string;
  readonly answer: string;
};

const contact = {
  phoneE164: '+40775630680',
  phoneDisplay: '+40 775 630 680',
  whatsappUrl: 'https://wa.me/40775630680',
  instagramUrl: 'https://www.instagram.com/englishminds_academy/',
  instagramHandle: '@englishminds_academy',
  street: 'Str. Observatorului 90, et.2',
  city: 'Cluj-Napoca',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Str.%20Observatorului%2090%2C%20Cluj-Napoca',
} as const;

const courseFacts = {
  duration: '3 ore pe săptămână',
  days: 'TODO: zilele cursurilor',
  groupSize: 'TODO: numărul de copii din grupă',
  textbook: 'TODO: manualul Cambridge folosit',
  monthlyPrice: 'TODO: prețul lunar',
} as const;

const levels: readonly Level[] = [
  {
    slug: 'starters',
    name: 'Starters',
    ageGroup: '5–6 ani',
    summary: 'Primele cuvinte și propoziții, prin joc, cântece și povești.',
    description:
      'Primele cuvinte și propoziții, prin joc, cântece și povești. Copilul prinde curaj să vorbească fără teama de a greși.',
    outcomes: [
      'Numără până la 20 și recunoaște culorile, animalele și membrii familiei',
      'Se prezintă și salută în engleză',
      'Înțelege instrucțiuni simple din clasă',
      'Cântă și ascultă povești scurte',
    ],
    photo: 'class',
  },
  {
    slug: 'pre-a1',
    name: 'Pre A1',
    ageGroup: '7–8 ani',
    summary: 'Vocabular de bază, citit și scris simplu, primele dialoguri.',
    description:
      'Vocabular de bază, citit și scris simplu, primele dialoguri. Engleza începe să se lege de ce învață la școală.',
    outcomes: [
      'Citește cuvinte și propoziții simple',
      'Vorbește despre el, casă, școală și mâncare',
      'Scrie cuvinte și propoziții scurte',
      'Răspunde la întrebări simple în dialog',
    ],
    photo: 'hands',
  },
  {
    slug: 'movers',
    name: 'Movers',
    ageGroup: '9–10 ani',
    summary: 'Propoziții complete, povestit la trecut și conversații scurte.',
    description: 'Propoziții complete, povestit la trecut și conversații scurte despre viața de zi cu zi.',
    outcomes: [
      'Povestește ce a făcut, la timpul trecut',
      'Descrie oameni, locuri și obiecte',
      'Citește și înțelege texte scurte',
      'Susține dialoguri de zi cu zi',
    ],
    photo: 'group',
  },
  {
    slug: 'flyers',
    name: 'Flyers',
    ageGroup: '11–12 ani',
    summary: 'Texte mai lungi, gramatică explicată simplu, pregătire pentru examen.',
    description:
      'Texte mai lungi și gramatică explicată simplu, cu pregătire pentru examenul Cambridge A2 Flyers.',
    outcomes: [
      'Folosește viitorul și comparațiile',
      'Scrie mesaje și povești scurte',
      'Înțelege texte și înregistrări mai lungi',
      'Se pregătește pentru examenul A2 Flyers',
    ],
    photo: 'boyReading',
  },
  {
    slug: 'a2-key',
    name: 'A2 Key',
    ageGroup: '13–14 ani',
    summary: 'Engleză pentru școală și viață, cu pregătire pentru examenul Cambridge.',
    description: 'Engleză pentru școală și viață, cu pregătire pentru examenul Cambridge A2 Key.',
    outcomes: [
      'Conversează despre școală, hobby-uri și călătorii',
      'Scrie e-mailuri și texte scurte',
      'Înțelege engleza vorbită în situații reale',
      'Se pregătește pentru examenul A2 Key',
    ],
    photo: 'teacherEma',
  },
];

const faq: readonly FaqEntry[] = [
  {
    question: 'De la ce vârstă poate începe copilul?',
    answer: 'Avem grupe de la 5 ani până la 14 ani, organizate pe vârste și niveluri.',
  },
  {
    question: 'Cum aflu nivelul copilului?',
    answer:
      'Faceți testul de nivel de pe site, apoi veniți la lecția demo gratuită. Acolo stabilim grupa potrivită.',
  },
  { question: 'Câte ore pe săptămână sunt cursurile?', answer: `${courseFacts.duration}.` },
  {
    question: 'După ce metodă predați?',
    answer: `După metoda Cambridge, adaptată vârstei copiilor, cu manualul ${courseFacts.textbook}.`,
  },
  {
    question: 'Când se văd rezultatele?',
    answer: 'Părinții observă rezultate vizibile după prima lună de curs.',
  },
  {
    question: 'Ce include oferta pre-sale 2026?',
    answer: `4 + 1 lună cadou. Detalii la ${contact.phoneDisplay}.`,
  },
  { question: 'Unde au loc cursurile?', answer: `${contact.street}, ${contact.city}.` },
];

export const site = {
  name: 'English Minds Academy',
  contact,
  levels,
  courseFacts,
  offer: {
    label: 'Ofertă pre-sale 2026',
    headline: '4 + 1 lună cadou',
    detail: 'Reducere pentru primii 20 înscriși',
  },
  values: [
    {
      title: 'Program structurat pe niveluri',
      text: 'Fiecare copil începe la nivelul lui, stabilit prin test și lecția demo.',
      tone: 'navy',
    },
    {
      title: 'Metodologie Cambridge',
      text: 'Manuale Cambridge, adaptate fiecărei grupe.',
      tone: 'orange',
    },
    {
      title: 'Rezultate vizibile după prima lună',
      text: 'Progres pas cu pas, pe care îl vezi și acasă.',
      tone: 'sun',
    },
  ] satisfies readonly ValueCard[],
  camps: {
    year: 'TODO: anul taberei',
    ageRange: 'TODO: vârstele copiilor',
    period: 'TODO: perioada taberei',
    schedule: 'TODO: programul zilnic',
    price: 'TODO: prețul pe săptămână',
    day: [
      { time: 'TODO: ora', title: 'Good morning!', text: 'Cântec de dimineață și jocul zilei.' },
      {
        time: 'TODO: ora',
        title: 'Proiectul săptămânii',
        text: 'Lucru în echipă pe o temă: călătorii, natură, meserii.',
      },
      { time: 'TODO: ora', title: 'Gustare și joacă', text: 'Pauză, tot în engleză.' },
      { time: 'TODO: ora', title: 'Show & tell', text: 'Fiecare copil prezintă ce a făcut azi.' },
    ] satisfies readonly CampSlot[],
    includes: [
      'TODO: Materiale și manuale',
      'TODO: Gustare',
      'TODO: Diplomă de participare',
      'TODO: Ieșire tematică',
    ],
  },
  company: {
    legalName: 'TODO: denumirea firmei',
    cui: 'TODO: CUI',
    registeredOffice: 'TODO: sediul social',
  },
  tracking: {
    ga4MeasurementId: 'TODO: ID GA4 (G-…)',
    metaPixelId: 'TODO: ID Meta Pixel',
    googleAdsId: 'TODO: ID Google Ads (AW-…)',
    googleAdsLeadLabel: 'TODO: eticheta conversiei Lead din Google Ads',
  },
  faq,
} as const;
