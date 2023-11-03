import { ICell, IPoint, ISpriteSheet, Rect, Renderer, SpriteSheet, Image } from "./engine";
import { RedHatBoy } from "./red_hat_boy";

export const LOW_PLATFORM: number = 420;
export const HIGH_PLATFORM: number = 375;
export const FIRST_PLATFORM: number = 200;

export const FLOATING_PLATFORM_SPRITES: [string, string, string] = ["13.png", "14.png", "15.png"];
export const FLOATING_PLATFORM_BOUNDING_BOXES: [Rect, Rect, Rect] = [
  Rect.new_from_x_y(0, 0, 60, 54),
  Rect.new_from_x_y(60, 0, 384 - 60 * 2, 93),
  Rect.new_from_x_y(384 - 60, 0, 60, 54),
];

export interface IObstacle {
  check_intersection(boy: RedHatBoy): void;
  draw(renderer: Renderer): void;
  move_horizontally(x: number): void;
  right(): number;
}

export interface IPlatform {
  sheet: ISpriteSheet;
  bounding_box_rects: Array<Rect>;
  sprites: Array<ICell>;
  position: IPoint;
}

export class Platform implements IPlatform, IObstacle {
  sheet: SpriteSheet;
  bounding_box_rects: Array<Rect>;
  sprites: Array<ICell>;
  position: IPoint;

  constructor(sheet: SpriteSheet, position: IPoint, sprite_names: Array<string>, bounding_boxes: Array<Rect>) {
    this.sprites = sprite_names
      .filter((sprite_name) => sheet.cell(sprite_name) !== undefined)
      .map((sprite_name) => sheet.cell(sprite_name));
    this.position = position;
    this.sheet = sheet;
    this.bounding_box_rects = bounding_boxes.map((bounding_box) =>
      Rect.new_from_x_y(
        bounding_box.x() + position.x,
        bounding_box.y() + position.y,
        bounding_box.width,
        bounding_box.height
      )
    );
  }

  bounding_boxes(): Array<Rect> {
    return this.bounding_box_rects;
  }

  draw(renderer: Renderer): void {
    let x = 0;
    this.sprites.forEach((sprite) => {
      this.sheet.draw(
        renderer,
        Rect.new_from_x_y(sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h),
        Rect.new_from_x_y(this.position.x + x, this.position.y, sprite.frame.w, sprite.frame.h)
      );
      x += sprite.frame.w;
    });
  }

  move_horizontally(x: number) {
    this.position.x += x;
    this.bounding_box_rects.forEach((bounding_box) => {
      bounding_box.set_x(bounding_box.x() + x);
    });
  }

  check_intersection(boy: RedHatBoy): void {
    const box_to_land_on = this.bounding_boxes().find((box) => boy.bounding_box().intersects(box));
    if (box_to_land_on !== undefined) {
      if (boy.velocity_y() > 0 && boy.pos_y() < this.position.y) {
        boy.land_on(box_to_land_on.y());
      } else {
        boy.knock_out();
      }
    }
  }

  right(): number {
    return this.bounding_boxes().reduce((a, b) => (b.right() > a ? b.right() : a), 0);
  }
}

export interface IBarrier {
  image: Image;
}

export class Barrier implements IBarrier, IObstacle {
  image: Image;

  constructor(image: Image) {
    this.image = image;
  }

  check_intersection(boy: RedHatBoy): void {
    if (boy.bounding_box().intersects(this.image.bounding_box())) {
      boy.knock_out();
    }
  }

  draw(renderer: Renderer): void {
    this.image.draw(renderer);
  }

  move_horizontally(x: number): void {
    this.image.move_horizontally(x);
  }

  right(): number {
    return this.image.right();
  }
}
