# Style lab

`/lab` renders the daily scene (`playground-leave`) in a candidate art direction, driven by the same engine state as the product. It is not part of the product: in production it is a 404 unless the server runs with `LAB=1`.

```
npm run dev
open http://localhost:3000/lab                                   # controls
open "http://localhost:3000/lab?style=diorama&storm=90&shot=1"   # clean frame for a screenshot
```

Query: `style=diorama|paper`, `storm=0..100`, `connection=0..100`, `delta=-50..50`, `shot=1` (hides the controls and the site chrome).

## Living Diorama

Code: `src/components/diorama/` (stage, toy child, props, `light.ts` with unit tests). No new dependencies. Real CSS 3D: a ground plane in perspective plus upright layers at depth, one key light computed by `dioramaLight()` from the storm number, three rain layers, ground mist, cloud shadows, bloom. Springs are CSS `linear()` easings generated from a damped oscillator. Only transform and opacity animate.

The ground is a separate 3D context painted before the upright layers. In one context Chrome splits the intersecting planes and draws rectangles of ground over the child.

Screenshots (production build, headless Chrome, 375×812 and 1280×800): `diorama-storm{90,55,20}-{375,1280}.png`.

Only the playground set, one hair style and one age band exist.
