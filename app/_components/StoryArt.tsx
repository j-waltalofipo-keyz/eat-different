// design-direction.md §6 (D36): the two ends of Eddie's route, drawn as matching cartoony line art.
// Shared style: cream outline, round joins, flat fills, hard ink offset shadow (#story-toon).
// Samoa by day (sand, orange trunks, sage fronds); KC by night (navy skyline, lit gold windows).
// Pure geometry — no hooks — so it renders on the server and in the preview script alike.

type Pt = [number, number];

const LINE = "#f3ead8";
const GOLD = "#f5b21a";
const INK = "#0b0b0b";
const SAND = "#f5b21a";
const TRUNK = "#c8731c";
const LEAF = "#8fb59a";
const CITY = "#101c4a";
const COPPER = "#c8641e";
const f = (v: number) => Math.round(v * 10) / 10;

/** Closed Catmull-Rom spline through the points → smooth cubic path (cartoony coastlines). */
function smoothClosed(pts: Pt[]): string {
  const n = pts.length;
  let d = `M${f(pts[0]![0])} ${f(pts[0]![1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n]!, pts[i]!, pts[(i + 1) % n]!, pts[(i + 2) % n]!];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

// ── Samoa ────────────────────────────────────────────────────────────────────────────────────
// Coastlines simplified from the official Samoa map (2000×1550 px frame), then scaled into the scene.
const MAP_SCALE = 0.22;
const toScene = ([x, y]: Pt): Pt => [2.9 + x * MAP_SCALE, 174.4 + y * MAP_SCALE];

const SAVAII: Pt[] = [
  [58, 485], [95, 455], [130, 462], [175, 480], [240, 468], [300, 458], [350, 452], [420, 428],
  [495, 408], [575, 405], [620, 383], [665, 380], [720, 402], [765, 462], [830, 540], [870, 610],
  [905, 690], [872, 760], [852, 815], [845, 872], [800, 875], [760, 828], [700, 822], [610, 852],
  [520, 862], [430, 876], [395, 848], [345, 808], [320, 745], [265, 712], [215, 650], [160, 590],
  [100, 532],
];
const UPOLU: Pt[] = [
  [1045, 975], [1090, 922], [1150, 914], [1215, 892], [1265, 874], [1345, 868], [1395, 886],
  [1440, 906], [1500, 934], [1540, 960], [1610, 978], [1660, 976], [1720, 1000], [1758, 1032],
  [1725, 1060], [1745, 1082], [1795, 1072], [1860, 1108], [1905, 1135], [1912, 1175], [1890, 1215],
  [1810, 1212], [1700, 1210], [1610, 1210], [1560, 1196], [1500, 1212], [1450, 1196], [1420, 1170],
  [1350, 1156], [1300, 1142], [1245, 1152], [1210, 1105], [1180, 1070], [1130, 1048], [1085, 1008],
];

/** Where the route leaves Samoa. */
export const APIA = toScene([1460, 922]);

type Frond = { a: number; len: number; droop: number };

/** Quadratic Bézier point. */
const q = (a: Pt, c: Pt, b: Pt, t: number): Pt => [
  (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t ** 2 * b[0],
  (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t ** 2 * b[1],
];

function frondPaths(c: Pt, { a, len, droop }: Frond) {
  const rad = (a * Math.PI) / 180;
  const tip: Pt = [c[0] + Math.cos(rad) * len, c[1] - Math.sin(rad) * len + droop];
  const spine: Pt = [(c[0] + tip[0]) / 2, (c[1] + tip[1]) / 2 - len * 0.3];
  const chord: Pt = [tip[0] - c[0], tip[1] - c[1]];
  const m = Math.hypot(...chord);
  let n: Pt = [chord[1] / m, -chord[0] / m];
  if (n[1] > 0) n = [-n[0], -n[1]]; // always bulge upward
  const w = len * 0.44;
  const up: Pt = [spine[0] + n[0] * w, spine[1] + n[1] * w];
  // Serrated underside, like the reference palm: sample the lower edge and notch every other point.
  const low: Pt = [spine[0] - n[0] * w * 0.25, spine[1] - n[1] * w * 0.25];
  let under = "";
  for (let i = 1; i <= 6; i++) {
    const [x, y] = q(tip, low, c, i / 6);
    const k = i % 2 && i < 6 ? w * 0.22 : 0;
    under += `L${f(x + n[0] * k)} ${f(y + n[1] * k)}`;
  }
  return {
    leaf: `M${f(c[0])} ${f(c[1])}Q${f(up[0])} ${f(up[1])} ${f(tip[0])} ${f(tip[1])}${under}Z`,
    rib: `M${f(c[0])} ${f(c[1])}Q${f(spine[0])} ${f(spine[1])} ${f(tip[0])} ${f(tip[1])}`,
  };
}

/** Side-view palm: curved segmented trunk + fronds + optional coconuts. */
function Palm({ base, lean, height, fronds, coconuts = 0 }: { base: Pt; lean: number; height: number; fronds: Frond[]; coconuts?: number }) {
  const top: Pt = [base[0] + lean, base[1] - height];
  const ctrl: Pt = [base[0] + lean * 0.25, base[1] - height * 0.55];
  const N = 10;
  const left: Pt[] = [];
  const right: Pt[] = [];
  const rings: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = q(base, ctrl, top, t);
    const d: Pt = [2 * (1 - t) * (ctrl[0] - base[0]) + 2 * t * (top[0] - ctrl[0]), 2 * (1 - t) * (ctrl[1] - base[1]) + 2 * t * (top[1] - ctrl[1])];
    const m = Math.hypot(...d);
    const nx = -d[1] / m;
    const ny = d[0] / m;
    const hw = (13 - 6 * t) / 2;
    left.push([p[0] - nx * hw, p[1] - ny * hw]);
    right.push([p[0] + nx * hw, p[1] + ny * hw]);
    if (i > 0 && i < N) {
      const dip: Pt = [p[0] - (d[0] / m) * 3.5, p[1] - (d[1] / m) * 3.5];
      rings.push(`M${f(p[0] - nx * hw)} ${f(p[1] - ny * hw)}Q${f(dip[0])} ${f(dip[1])} ${f(p[0] + nx * hw)} ${f(p[1] + ny * hw)}`);
    }
  }
  const trunk = `M${[...left, ...right.reverse()].map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
  const leaves = fronds.map((fr) => frondPaths(top, fr));
  const nuts: Pt[] = [
    [top[0] - 4, top[1] + 7],
    [top[0] + 5, top[1] + 9],
    [top[0] + 1, top[1] + 15],
  ];
  return (
    <g>
      <path d={trunk} fill={TRUNK} />
      <path d={rings.join("")} fill="none" stroke={INK} strokeOpacity="0.45" strokeWidth="2" />
      <path d={trunk} fill="none" />
      {nuts.slice(0, coconuts).map(([x, y]) => (
        <circle key={`${x}${y}`} cx={f(x)} cy={f(y)} r="5" fill="#6b3d1c" strokeWidth="2.5" />
      ))}
      {leaves.map((l, i) => (
        <g key={i}>
          <path d={l.leaf} fill={LEAF} />
          <path d={l.rib} fill="none" stroke={INK} strokeOpacity="0.35" strokeWidth="2" />
        </g>
      ))}
    </g>
  );
}

export function SamoaArt() {
  const savaii = smoothClosed(SAVAII.map(toScene));
  const upolu = smoothClosed(UPOLU.map(toScene));
  return (
    <g stroke={LINE} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#story-toon)">
      {/* Cartoon swells around the islands */}
      <g fill="none" strokeWidth="2.5" opacity="0.55">
        <path d="M12 402 q8 -7 16 0 t16 0" />
        <path d="M240 300 q8 -7 16 0 t16 0" />
        <path d="M405 452 q8 -7 16 0 t16 0" />
      </g>
      <path d={savaii} fill={SAND} />
      <path d={upolu} fill={SAND} />
      {/* Manono + Apolima */}
      <circle cx={f(toScene([990, 945])[0])} cy={f(toScene([990, 945])[1])} r="4" fill={SAND} strokeWidth="2.5" />
      <circle cx={f(toScene([937, 907])[0])} cy={f(toScene([937, 907])[1])} r="3" fill={SAND} strokeWidth="2.5" />
      {/* Twin palms on Savai'i leaning apart, one palm on Upolu */}
      <Palm
        base={toScene([470, 720])}
        lean={-34}
        height={112}
        coconuts={0}
        fronds={[
          { a: 195, len: 50, droop: 30 },
          { a: 160, len: 52, droop: 14 },
          { a: 118, len: 42, droop: 4 },
          { a: 95, len: 34, droop: 0 },
          { a: 72, len: 44, droop: 8 },
          { a: 28, len: 50, droop: 24 },
        ]}
      />
      <Palm
        base={toScene([505, 722])}
        lean={30}
        height={100}
        coconuts={2}
        fronds={[
          { a: 172, len: 48, droop: 26 },
          { a: 128, len: 42, droop: 6 },
          { a: 88, len: 42, droop: 6 },
          { a: 62, len: 36, droop: 2 },
          { a: 42, len: 52, droop: 16 },
          { a: -8, len: 50, droop: 30 },
        ]}
      />
      <Palm
        base={toScene([1235, 1062])}
        lean={-12}
        height={62}
        coconuts={1}
        fronds={[
          { a: 175, len: 28, droop: 14 },
          { a: 120, len: 26, droop: 2 },
          { a: 60, len: 26, droop: 2 },
          { a: 5, len: 30, droop: 14 },
        ]}
      />
    </g>
  );
}

// ── Kansas City ──────────────────────────────────────────────────────────────────────────────
// Skyline traced from the owner's reference silhouette, left → right. Local units: x along the
// ground, h = height above it; scaled into the scene below.
const KC_X = 637.8;
const KC_GROUND = 178;
const KC_SCALE = 0.92;
const kc = ([x, h]: Pt): Pt => [KC_X + x * KC_SCALE, KC_GROUND - h * KC_SCALE];
const at = (x: number, h: number) => kc([x, h]).map(f).join(" ");

/** Where the route arrives: the road in front of the skyline. */
export const KC_ROAD: Pt = [550, KC_GROUND];

/** The skyline alone, for pages that show just the city (Road to the Truck). */
export const KC_FRAME = "576 40 424 140";

const SKYLINE: Pt[] = [
  // Bartle Hall roof, under the Sky Stations
  [-58, 0], [-58, 11], [-55, 13], [26, 13],
  [26, 15], [50, 15], [50, 35], [65, 35], [65, 46], [76, 46], [76, 38], [97, 38], [97, 57],
  [112, 57], [112, 72], [117, 72], [117, 80], [123, 80], [123, 72], [128, 72], [128, 62], [136, 62],
  // One Kansas City Place — stepped crown
  [136, 100], [139, 100], [139, 106], [142, 106], [142, 112], [146, 112], [149, 121], [152, 112],
  [157, 112], [157, 106], [160, 106], [160, 100], [163, 100], [163, 72], [176, 72],
  // Town Pavilion
  [176, 96], [179, 96], [181, 102], [189, 102], [191, 96], [194, 96], [194, 75], [203, 75], [203, 62],
  // slender tower
  [206, 62], [206, 84], [208.5, 92], [211, 84], [211, 72], [230, 72], [230, 53], [244, 53], [244, 50],
  [270, 50], [270, 66],
  // Power & Light — art-deco stepped crown
  [274, 66], [274, 74], [277, 74], [277, 81], [280, 81], [280, 88], [286, 88], [286, 81], [289, 81],
  [289, 74], [292, 74], [292, 66], [296, 66], [296, 46], [312, 46], [312, 75], [316, 75], [316, 80],
  [330, 80], [330, 75], [334, 75], [334, 45], [350, 45], [350, 22],
];

const WINDOWS: Pt[] = [
  // One KC Place strips, Town Pavilion bands, Power & Light, right tower, a few low blocks
  ...[88, 78, 68, 58, 48, 38, 28].flatMap((h): Pt[] => [[142, h], [149, h], [156, h]]),
  ...[88, 78, 68, 58].flatMap((h): Pt[] => [[181, h], [188, h]]),
  ...[58, 50, 42, 34, 26].flatMap((h): Pt[] => [[278, h], [283, h], [288, h]]),
  ...[66, 56, 46, 36, 26].flatMap((h): Pt[] => [[319, h], [326, h]]),
  [102, 44], [106, 32], [216, 58], [222, 46], [253, 38], [260, 28], [56, 24],
];

// Sky Stations (R.M. Fischer, 1994) on the Bartle Hall pylons: each sculpture is different.
const ROOF = 13;
const PYLONS = [
  { x: -44, top: 66, crown: "cup" },
  { x: -27, top: 70, crown: "orb" },
  { x: -10, top: 67, crown: "flare" },
  { x: 7, top: 71, crown: "antenna" },
] as const;

function SkyStation({ x, top: t, crown, line }: { x: number; top: number; crown: (typeof PYLONS)[number]["crown"]; line: string }) {
  const cables = [-13, -8, 8, 13].map((dx) => `M${at(x, t - 6)}L${at(x + dx, ROOF)}`).join("");
  const column = `M${at(x - 3, ROOF)}L${at(x - 2.2, t)}L${at(x + 2.2, t)}L${at(x + 3, ROOF)}Z`;
  const cap = `M${at(x - 4, t)}L${at(x - 4, t + 2.5)}L${at(x + 4, t + 2.5)}L${at(x + 4, t)}Z`;
  const r = (h: number) => f(h * KC_SCALE);
  return (
    <g strokeWidth="1.8">
      <path d={cables} fill="none" strokeWidth="1.1" opacity="0.7" />
      <path d={column} fill={COPPER} />
      <path d={cap} fill={GOLD} />
      <g fill={GOLD}>
        {crown === "cup" && (
          <path d={`M${at(x - 3, t + 2.5)}L${at(x - 8.5, t + 11.5)}L${at(x - 6.5, t + 16.5)}L${at(x - 4.3, t + 11.5)}L${at(x, t + 18.5)}L${at(x + 4.3, t + 11.5)}L${at(x + 6.5, t + 16.5)}L${at(x + 8.5, t + 11.5)}L${at(x + 3, t + 2.5)}Z`} />
        )}
        {crown === "orb" && (
          <>
            <path d={`M${at(x, t + 2.5)}V${kc([x, t + 25])[1]}M${at(x - 4.5, t + 18)}H${kc([x + 4.5, 0])[0]}`} fill="none" stroke={line} />
            <circle cx={kc([x, t + 9.5])[0]} cy={kc([x, t + 9.5])[1]} r={r(4.6)} />
          </>
        )}
        {crown === "flare" && (
          <>
            <path d={`M${at(x - 3, t + 2.5)}L${at(x - 8.5, t + 10)}L${at(x + 8.5, t + 10)}L${at(x + 3, t + 2.5)}Z`} />
            <path d={`M${at(x, t + 10)}V${kc([x, t + 17])[1]}`} fill="none" stroke={line} />
            <circle cx={kc([x, t + 19.3])[0]} cy={kc([x, t + 19.3])[1]} r={r(2.3)} />
          </>
        )}
        {crown === "antenna" && (
          <path
            d={`M${at(x, t + 2.5)}V${kc([x, t + 29])[1]}${[[8, 8.5], [13, 6.5], [18, 4.7], [23, 2.9]].map(([h, w]) => `M${at(x - w!, t + h!)}H${kc([x + w!, 0])[0]}`).join("")}`}
            fill="none"
            stroke={line}
          />
        )}
      </g>
    </g>
  );
}

/**
 * The KC skyline. Story scene: cream outline over the Pacific (defaults). Road to the Truck:
 * `line` = ink on cream, no road, plus a lit "KANSAS CITY" sign across the base.
 */
export function KcArt({ line = LINE, filterId = "story-toon", road = true, sign = false }: { line?: string; filterId?: string; road?: boolean; sign?: boolean }) {
  const outline = `M${SKYLINE.map(kc).map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Q${f(kc([366, 18])[0])} ${f(kc([366, 18])[1])} ${f(kc([382, 0])[0])} ${f(kc([382, 0])[1])}Z`;
  const [ax, ay] = kc([120, 80]);
  const [sx, sy] = kc([283, 88]);
  const [signX, signY] = kc([190, 3.5]);
  return (
    <g stroke={line} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${filterId})`}>
      {PYLONS.map((p) => (
        <SkyStation key={p.x} {...p} line={line} />
      ))}
      <path d={outline} fill={CITY} />
      <path d={`M${f(ax)} ${f(ay)}V${f(ay - 20)}M${f(sx)} ${f(sy)}V${f(sy - 12)}`} fill="none" strokeWidth="2.5" />
      <g fill={GOLD} stroke="none">
        {WINDOWS.map(kc).map(([x, y]) => (
          <rect key={`${x}-${y}`} x={f(x - 1.6)} y={f(y - 2.4)} width="3.2" height="4.8" rx="1" />
        ))}
        {sign && (
          <text x={f(signX)} y={f(signY)} textAnchor="middle" fontFamily="var(--font-anton)" fontSize="10" letterSpacing="3">
            KANSAS CITY
          </text>
        )}
      </g>
      {/* the road the truck pulls in on */}
      {road && <path d={`M${KC_ROAD[0] - 40} ${KC_GROUND}H${f(kc([388, 0])[0])}`} fill="none" />}
    </g>
  );
}

/** Hard offset shadow shared by both scenes — the "cartoon sticker" look. One per <svg> (unique id). */
export function ToonFilter({ id = "story-toon" }: { id?: string }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="4" dy="4" stdDeviation="0" floodColor={INK} floodOpacity="0.5" />
    </filter>
  );
}

/**
 * Scene framing. Phones get a zoomed camera (same 565×330 aspect at both ends so the height never
 * jumps) that pans from Samoa, route start in view, to the skyline, truck on the road in view.
 */
export const CAMERA = { full: "0 0 1000 480", samoa: "-30 145 565 330", kc: "478 -30 565 330" } as const;

export const ROUTE = `M${f(APIA[0])} ${f(APIA[1])} C 380 330, 400 270, 452 254 S 500 ${KC_GROUND}, ${KC_ROAD[0]} ${KC_GROUND}`;
