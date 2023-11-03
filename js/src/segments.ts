import { IPoint, SpriteSheet, Image } from "./engine";
import {
  Barrier,
  FIRST_PLATFORM,
  FLOATING_PLATFORM_BOUNDING_BOXES,
  FLOATING_PLATFORM_SPRITES,
  HIGH_PLATFORM,
  IObstacle,
  LOW_PLATFORM,
  Platform,
} from "./obstacles";

export function create_floating_platform(sprite_sheet: SpriteSheet, position: IPoint): Platform {
  return new Platform(sprite_sheet, position, FLOATING_PLATFORM_SPRITES, FLOATING_PLATFORM_BOUNDING_BOXES);
}

export function stone_and_platform(
  stone: HTMLImageElement,
  sprite_sheet: SpriteSheet,
  offset_x: number
): Array<IObstacle> {
  const INITIAL_STONE_OFFSET: number = 150;
  const STONE_ON_GROUND: number = 520;
  return [
    new Barrier(
      new Image(stone, {
        x: offset_x + INITIAL_STONE_OFFSET,
        y: STONE_ON_GROUND,
      })
    ),
    create_floating_platform(sprite_sheet, {
      x: offset_x + FIRST_PLATFORM,
      y: LOW_PLATFORM,
    }),
  ];
}

export function platform_and_stone(
  stone: HTMLImageElement,
  sprite_sheet: SpriteSheet,
  offset_x: number
): Array<IObstacle> {
  const INITIAL_STONE_OFFSET: number = 150;
  const STONE_ON_GROUND: number = 520;
  return [
    new Barrier(
      new Image(stone, {
        x: offset_x + FIRST_PLATFORM,
        y: STONE_ON_GROUND,
      })
    ),
    create_floating_platform(sprite_sheet, {
      x: offset_x + INITIAL_STONE_OFFSET,
      y: HIGH_PLATFORM,
    }),
  ];
}
