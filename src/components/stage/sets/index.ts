import { hitBrother } from "./hit-brother";
import { bathTime } from "./bath-time";
import { carSeat } from "./car-seat";
import { gettingDressed } from "./getting-dressed";
import type { SceneSet } from "../types";
import { genericSet } from "./generic";
import { playgroundLeave } from "./playground-leave";
import { storeCandy } from "./store-candy";
import { bedtime } from "./bedtime";
import { wrongCup } from "./wrong-cup";
import { tabletOff } from "./tablet-off";
import { dinnerRefusal } from "./dinner-refusal";

/*
 * One set per library scene. The SETS session adds the other ten here, one
 * file each in this folder. A scene without an entry uses the generic room.
 */
export const SETS: Record<string, SceneSet> = {
  "playground-leave": playgroundLeave,
  "store-candy": storeCandy,
  bedtime,
  "wrong-cup": wrongCup,
  "tablet-off": tabletOff,
  "dinner-refusal": dinnerRefusal,
  "car-seat": carSeat,
  "getting-dressed": gettingDressed,
  "hit-brother": hitBrother,
  "bath-time": bathTime,
};

export function setFor(scene: { id: string; place: string }): SceneSet {
  return SETS[scene.id] ?? genericSet(scene.place);
}
