export const AGE_GROUPS = ['5–6 ani', '7–8 ani', '9–10 ani', '11–12 ani', '13–14 ani'] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export type Level = {
  readonly name: string;
  readonly ageGroup: AgeGroup;
  readonly description: string;
  readonly outcomes: readonly string[];
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
    name: 'Starters',
    ageGroup: '5–6 ani',
    description:
      'Primele cuvinte și propoziții, prin joc, cântece și povești. Copilul prinde curaj să vorbească fără teama de a greși.',
    outcomes: [
      'Numără până la 20 și recunoaște culorile, animalele și membrii familiei',
      'Se prezintă și salută în engleză',
      'Înțelege instrucțiuni simple din clasă',
      'Cântă și ascultă povești scurte',
    ],
  },
  {
    name: 'Pre A1',
    ageGroup: '7–8 ani',
    description:
      'Vocabular de bază, citit și scris simplu, primele dialoguri. Engleza începe să se lege de ce învață la școală.',
    outcomes: [
      'Citește cuvinte și propoziții simple',
      'Vorbește despre el, casă, școală și mâncare',
      'Scrie cuvinte și propoziții scurte',
      'Răspunde la întrebări simple în dialog',
    ],
  },
  {
    name: 'Movers',
    ageGroup: '9–10 ani',
    description: 'Propoziții complete, povestit la trecut și conversații scurte despre viața de zi cu zi.',
    outcomes: [
      'Povestește ce a făcut, la timpul trecut',
      'Descrie oameni, locuri și obiecte',
      'Citește și înțelege texte scurte',
      'Susține dialoguri de zi cu zi',
    ],
  },
  {
    name: 'Flyers',
    ageGroup: '11–12 ani',
    description:
      'Texte mai lungi și gramatică explicată simplu, cu pregătire pentru examenul Cambridge A2 Flyers.',
    outcomes: [
      'Folosește viitorul și comparațiile',
      'Scrie mesaje și povești scurte',
      'Înțelege texte și înregistrări mai lungi',
      'Se pregătește pentru examenul A2 Flyers',
    ],
  },
  {
    name: 'A2 Key',
    ageGroup: '13–14 ani',
    description: 'Engleză pentru școală și viață, cu pregătire pentru examenul Cambridge A2 Key.',
    outcomes: [
      'Conversează despre școală, hobby-uri și călătorii',
      'Scrie e-mailuri și texte scurte',
      'Înțelege engleza vorbită în situații reale',
      'Se pregătește pentru examenul A2 Key',
    ],
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
    answer: 'După metoda Cambridge, adaptată vârstei copiilor, cu manuale Cambridge precum Kid’s Box.',
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
  camps: {
    period: 'TODO: perioada taberei',
    schedule: 'TODO: programul zilnic',
    price: 'TODO: prețul taberei',
  },
  company: {
    legalName: 'TODO: denumirea firmei',
    cui: 'TODO: CUI',
    registeredOffice: 'TODO: sediul social',
  },
  faq,
} as const;
