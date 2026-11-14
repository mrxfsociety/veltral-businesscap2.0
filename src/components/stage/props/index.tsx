import { Bunting, Balloons, Cake, Gift } from "./party";
import { BoardGame, ToyShelf, DumpTruck, Blocks } from "./playroom";
import { TiledPanel, TowelHook, Bathtub, RubberDuck } from "./bath";
import type { ComponentType } from "react";
import {
  Bed,
  Bookshelf,
  Chair,
  Door,
  Fridge,
  Lamp,
  PictureFrame,
  Plant,
  Rug,
  Sofa,
  Table,
  Window,
} from "./home";
import {
  Backpack,
  Bench,
  Car,
  Fence,
  Hedge,
  House,
  Slide,
  Swing,
  Tree,
} from "./outdoor";
import { CandyRack, Cart, CheckoutBelt, Shelves } from "./shop";
import type { PropProps } from "./types";
import { Book, Cup, WallShelf } from "./rehearsal";
import { TabletFaceDown, PendantLamp, DinnerPlate } from "./everyday";
import { GarageDoor, CarSeat, Dresser, Clothes, Shoes } from "./travel";

/*
 * The prop registry. A set refers to props by these ids. To add a prop:
 * draw it in one of the files in this folder (or a new one), then add it here.
 */
export const PROPS = {
  tree: Tree,
  hedge: Hedge,
  slide: Slide,
  swing: Swing,
  bench: Bench,
  backpack: Backpack,
  house: House,
  car: Car,
  fence: Fence,
  shelves: Shelves,
  candyRack: CandyRack,
  checkoutBelt: CheckoutBelt,
  cart: Cart,
  window: Window,
  pictureFrame: PictureFrame,
  sofa: Sofa,
  lamp: Lamp,
  rug: Rug,
  table: Table,
  chair: Chair,
  fridge: Fridge,
  bed: Bed,
  door: Door,
  plant: Plant,
  bookshelf: Bookshelf,
  book: Book,
  cup: Cup,
  wallShelf: WallShelf,
  tabletFaceDown: TabletFaceDown,
  pendantLamp: PendantLamp,
  dinnerPlate: DinnerPlate,
  garageDoor: GarageDoor,
  carSeat: CarSeat,
  dresser: Dresser,
  clothes: Clothes,
  shoes: Shoes,
  boardGame: BoardGame,
  tiledPanel: TiledPanel,
  towelHook: TowelHook,
  bathtub: Bathtub,
  rubberDuck: RubberDuck,
  toyShelf: ToyShelf,
  dumpTruck: DumpTruck,
  blocks: Blocks,
  bunting: Bunting,
  balloons: Balloons,
  cake: Cake,
  gift: Gift,
} satisfies Record<string, ComponentType<PropProps>>;

export type PropId = keyof typeof PROPS;
export type { PropProps } from "./types";
