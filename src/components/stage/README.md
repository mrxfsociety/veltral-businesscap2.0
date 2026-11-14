# The paper stage

`<PaperStage>` is a toy theatre of cut paper. It is **presentational**: it receives engine state and renders it. It never calls the API and never computes an outcome. Every visual is a function of the engine numbers, through two pure functions in `mood.ts`:

- `stageMood({ arousal, connection, lastDelta, outcome })` → clouds, rain, lightning, sun, storm tint, sway, trend, confetti, sign down, muted.
- `kidMood(...)` → the child's pose, face, shake, flush, tears, stance (connection), facing.

Both are unit-tested in `mood.test.ts`, including monotonicity (more arousal never produces less storm).

```tsx
import { PaperStage } from "@/components/stage/paper-stage";

<PaperStage
  scene={scene} // PublicScene (id, place, ageBand, limit, childName)
  state={{ arousal, connection, lastDelta, turn }}
  outcome="ongoing" // or an engine Outcome, or "intro"
  curtain="open" // "closed" | "open" | "falling"
  size="full" // "thumb": static, no weather animation, no parallax, no curtains
  seed={`${sessionId}:${turn}`} // anything that looks random is seeded
  bubble={{ line, action }} // the child's line in a paper bubble
  hud={<HeadsUp />} // the strip inside the top of the proscenium
>
  {/* HTML overlay on the stage: real, accessible text */}
</PaperStage>;
```

Thumbnails (scene shelf, landing, debrief): `<PaperStage size="thumb" scene={scene} state={{ arousal: scene.startArousal, connection: 50, lastDelta: 0, turn: 0 }} />`.

**Look at any set in storm and calm:** run `npm run dev` and open `/play/stage-lab` (development only; it returns 404 in production). Sliders for storm, connection, delta, outcome and curtain; three thumbnails underneath.

## Planes

All planes share one viewBox, `0 0 400 300`, bottom-anchored (`xMidYMax slice`). On laptops the picture is 16:10, so the top 50 units are cropped: keep everything that matters below y = 60.

| Plane  | Depth | What goes here                                                                                    |
| ------ | ----- | ------------------------------------------------------------------------------------------------- |
| sky    | 0.00  | wall or sky paper, sun or moon on its stick, the floor, the horizon fold (drawn by `weather.tsx`) |
| far    | 0.25  | `set.far`: distant pieces standing on the horizon line (y ≈ 228–234), small scale                 |
| clouds | 0.40  | weather on strings (drawn by `weather.tsx`)                                                       |
| mid    | 0.50  | `set.mid`, then the limit sign                                                                    |
| kid    | 0.70  | `<PaperKid>`                                                                                      |
| front  | 1.00  | `set.front`: near pieces crossing the bottom edge (y ≈ 298–306)                                   |
| rain   | 1.00  | rain strands and confetti                                                                         |

Depth drives parallax (`depth × 14px` horizontally) and the contact shadow offset. Shadows are a CSS `drop-shadow` on static planes only; moving pieces carry their own shadow shape.

**Keep the centre clear.** The child stands between x 130 and 260 (it backs to x ≈ 130 at low connection and steps forward at high connection). The speech bubble floats above the child. **Keep stage right for the sign**: the sign stands at x ≈ 330 with a board 78 units wide. The curtains cover about 15 units at each edge, so nothing important outside x 20–380.

## How to add a prop

1. Draw it in `props/outdoor.tsx`, `props/home.tsx`, `props/shop.tsx` or a new file in `props/`. A prop is a component `({ tint }: PropProps) => <g>…</g>`.
2. Local coordinates: **(0, 0) is the bottom centre where the piece stands**; draw upward (negative y). A wall piece (window, frame) stands on its sill.
3. Rules: at most 25 paths, two to four papers from `palette.ts` (`PAPER.x`, never a raw hex), **one** fold or shadow detail (a darker facet of the same hue on the shaded side — light comes from the top left, so shade the right or the underside). Cut paths a little irregular, as if with scissors: `L-44 -26 L44 -27`, not a perfect rectangle. No strokes except hairlines and wires; no gradients; no SVG filters.
4. `tint` replaces the piece's main paper so one prop serves several sets.
5. Register it in `props/index.tsx` (`PROPS`). The id becomes a `PropId`.

Reuse before drawing: `tree hedge slide swing bench backpack house car fence shelves candyRack checkoutBelt cart window pictureFrame sofa lamp rug table chair fridge bed door plant bookshelf`.

## How to add a set

A set is data: `SceneSet` in `types.ts`.

```ts
export const bedtime: SceneSet = {
  timeOfDay: "night", // day | golden | evening | night → sky paper, sun or moon
  wall: "stormLight", // optional; defaults to the sky paper for the time of day
  floor: "kraft",
  floorPattern: "boards", // boards | tiles | grass | rug | none
  horizon: 232, // where the floor folds up into the wall
  far: [{ prop: "window", x: 240, y: 166, scale: 0.85, tint: "storm" }],
  mid: [{ prop: "bed", x: 78, y: 262 }],
  front: [{ prop: "rug", x: 214, y: 300, tint: "teal" }],
  sign: { x: 330, y: 278 },
};
```

1. One file per scene in `sets/`, named after the scene id.
2. Add it to `SETS` in `sets/index.ts`.
3. Open `/play/stage-lab`, pick the scene, look at storm 85 and calm 20, full size and thumbnail, next to `playground-leave`.

### Worked example: `playground-leave`

```ts
far:   tree 34/234 ×0.95 · tree 102/230 ×0.68 (flipped) · hedge 236/234 ×0.75 · tree 300/232 ×0.78 · tree 378/236 ×1.05 (flipped)
mid:   slide 78/264 · swing 282/258 ×0.86
front: bench 44/304 ×1.12 · backpack 104/300
sign:  330/278
```

Why each piece is where it is:

- **Far:** five trees and a hedge on the horizon line, at different scales and flipped, so the treeline is irregular and reads as distance. Nothing in the far plane is taller than the mid pieces in front of it. The golden sky is the wall paper; the low sun peeks above the trees on the right and rises on its stick when Zoe calms down.
- **Mid:** the slide and the swing are what Zoe does not want to leave. They frame the centre band from the left and the right without entering it. The sign stands in front of the swing's right post.
- **Kid:** Zoe stands in the clear centre band.
- **Front:** the bench and her backpack cross the bottom-left edge. They are the nearest layer, so they move most under parallax and give the stage its depth. The backpack is the quiet hint that it is time to go.

## The child

`PaperKid` is one rig with twelve looks (`kids.ts`: skin, hair style and colour, top, bottom, trim). Custom scenes pick a look by a stable hash of the scene id. Age band changes proportions (`bodyFor`). Joints spring (`stiffness 260, damping 22`); continuous motion (stomp, kick, shake, breath, tears) is CSS on inner groups in `kid.module.css`.

| Storm            | Pose                                   | Face               |
| ---------------- | -------------------------------------- | ------------------ |
| ≥ 85             | floor, kicking                         | wail, tears flying |
| 70–84            | stomp, arms up                         | shout              |
| 55–69            | arms crossed, turned a little          | pout               |
| 40–54            | head down, shoulders shaking           | wobble, a tear     |
| 26–39            | arms loose, slow breath                | flat, eyes up      |
| ≤ 25, limit held | arms open, small step forward          | small smile        |
| ≤ 25, gave in    | holding the wanted thing, looking away | pleased            |

## Motion and budgets

- Four moves only: **hinge** (planes pop up from the floor, spring 260/22, 80 ms stagger), **rail** (sheets slide in, 420 ms `cubic-bezier(.2,.8,.2,1)`), **string** (clouds, sun, sign: spring 120/8), **stamp** (scale 1.4 → 1 with ±6°, spring 600/28).
- Only `transform` and `opacity` animate. No `linear` or `ease` timing.
- `prefers-reduced-motion`: everything becomes a 150 ms cross-fade and the weather is static.
- No WebGL. At most 36 rain strands. SVG filters are never applied to moving layers.
- The stage is `aria-hidden`; a visually hidden sentence describes it ("Storm 75, rising. Zoe is stomping and shouting.").
