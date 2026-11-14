/*
 * Construction paper for the stage. The base colours are the REDESIGN tokens;
 * "-dark" and "-light" are the same hue at a different lightness, used for
 * folds, shaded sides and far planes. Never add a new hue here.
 */
export const PAPER = {
  cream: "#F4ECDD",
  creamDark: "#E3D6BE",
  sheet: "#FBF6EA",
  ink: "#1E2740",
  ink2: "#56607A",
  rule: "#D9CDB8",
  ruleDark: "#C2B399",
  tomato: "#C8431F",
  tomatoDark: "#9E3216",
  tomatoLight: "#E07A58",
  teal: "#2B7A72",
  tealDark: "#1F5C56",
  tealLight: "#6FA9A1",
  mustard: "#E2A93B",
  mustardDark: "#B98424",
  mustardLight: "#F0CD84",
  sky: "#A8CBD3",
  skyDark: "#82AAB4",
  skyLight: "#CFE2E5",
  storm: "#39435C",
  stormLight: "#6B7590",
  plum: "#5E3B55",
  plumDark: "#462B40",
  plumLight: "#8A6680",
  sage: "#98AE95",
  sageDark: "#728C70",
  sageLight: "#BCCBB9",
  blush: "#F0B49C",
  blushDark: "#D9927A",
  kraft: "#C4A075",
  kraftDark: "#9E7C52",
  kraftLight: "#DCC3A0",
  /* Skin papers */
  skin1: "#F3D3BC",
  skin2: "#E3B48F",
  skin3: "#C68E6A",
  skin4: "#9A6748",
  skin5: "#6E4530",
  /* Hair papers */
  hair1: "#2A1F1B",
  hair2: "#5A3B24",
  hair3: "#A8662E",
  hair4: "#D9A441",
  hair5: "#B5452E",
} as const;

export type PaperColor = keyof typeof PAPER;

export function paper(color: PaperColor): string {
  return PAPER[color];
}

/** Wall/sky paper for each time of day. */
export const SKY_BY_TIME = {
  day: "sky",
  golden: "mustardLight",
  evening: "stormLight",
  night: "storm",
} as const satisfies Record<string, PaperColor>;
