export type AlphabetItem = {
  letter: string;
  label: string;
  image: string;
};

export const alphabetItems: AlphabetItem[] = [
  { letter: "A", label: "Abelha", image: "/alphabet/01_abelha.png" },
  { letter: "B", label: "Borboleta", image: "/alphabet/02_borboleta.png" },
  { letter: "C", label: "Cachorro", image: "/alphabet/03_cachorro.png" },
  { letter: "D", label: "Dinossauro", image: "/alphabet/04_dinossauro.png" },
  { letter: "E", label: "Elefante", image: "/alphabet/05_elefante.png" },
  { letter: "F", label: "Formiga", image: "/alphabet/06_formiga.png" },
  { letter: "G", label: "Gato", image: "/alphabet/07_gato.png" },
  { letter: "H", label: "Hipopótamo", image: "/alphabet/08_hipopotamo.png" },
  { letter: "I", label: "Iguana", image: "/alphabet/09_iguana.png" },
  { letter: "J", label: "Jacaré", image: "/alphabet/10_jacare.png" },
  { letter: "K", label: "Kiwi", image: "/alphabet/12_kiwi2.png" },
  { letter: "L", label: "Leão", image: "/alphabet/13_leao.png" },
  { letter: "M", label: "Macaco", image: "/alphabet/14_macaco.png" },
  { letter: "N", label: "Navio", image: "/alphabet/15_navio.png" },
  { letter: "O", label: "Ovelha", image: "/alphabet/16_ovelha.png" },
  { letter: "P", label: "Pato", image: "/alphabet/17_pato.png" },
  { letter: "Q", label: "Queijo", image: "/alphabet/18_queijo.png" },
  { letter: "R", label: "Raposa", image: "/alphabet/19_raposa.png" },
  { letter: "S", label: "Sapo", image: "/alphabet/20_sapo.png" },
  { letter: "T", label: "Tartaruga", image: "/alphabet/22_tartaruga2.png" },
  { letter: "U", label: "Urso", image: "/alphabet/23_urso.png" },
  { letter: "V", label: "Vaca", image: "/alphabet/24_vaca.png" },
  { letter: "W", label: "Waffle", image: "/alphabet/25_waffle.png" },
  { letter: "X", label: "Xícara", image: "/alphabet/26_xicara.png" },
  { letter: "Y", label: "Yogurt", image: "/alphabet/27_yogurt.png" },
  { letter: "Z", label: "Zebra", image: "/alphabet/28_zebra.png" },
];

export function normalizeAlphabetKey(value: string): string {
  const cleaned = value
    .trim()
    .toLocaleUpperCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return Array.from(cleaned)[0] ?? "A";
}

export function getAlphabetItem(letter: string): AlphabetItem | undefined {
  const key = normalizeAlphabetKey(letter);
  return alphabetItems.find((item) => item.letter === key);
}
