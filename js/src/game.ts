import { fetch_json } from "./browser";
import { IPoint, IRenderer, ISheet, Renderer, load_image } from "./engine";

interface IGame {
  initialize(): Promise<void>;
  update(): void;
  draw(renderer: IRenderer): void;
}

interface IWalkTheDog {
  image: HTMLImageElement | undefined;
  sheet: ISheet | undefined;
  frame: number;
  position: IPoint;
}

export class WalkTheDog implements IWalkTheDog, IGame {
  image: HTMLImageElement | undefined = undefined;
  sheet: ISheet | undefined = undefined;
  frame: number = 0;
  position: IPoint = { x: 0, y: 0 };

  async initialize(): Promise<void> {
    let sheet = await fetch_json("rhb.json");
    let image = await load_image("rhb.png");
    this.sheet = sheet;
    this.image = image;
  }

  update(): void {
    // let mut velocity = Point { x: 0, y: 0 };
    // if keystate.is_pressed("ArrowDown") {
    //     velocity.y += 3;
    // }
    // if keystate.is_pressed("ArrowUp") {
    //     velocity.y -= 3;
    // }
    // if keystate.is_pressed("ArrowRight") {
    //     velocity.x += 3;
    // }
    // if keystate.is_pressed("ArrowLeft") {
    //     velocity.x -= 3;
    // }
    // self.position.x += velocity.x;
    // self.position.y += velocity.y;

    if (this.frame < 23) {
      this.frame += 1;
    } else {
      this.frame = 0;
    }
  }

  draw(renderer: Renderer): void {
    let current_sprite = Math.floor(this.frame / 3 + 1);
    let frame_name = `Run (${current_sprite}).png`;
    let sprite = this.sheet!.frames[frame_name];
    renderer.clear({
      x: 0.0,
      y: 0.0,
      width: 570.0,
      height: 570.0,
    });
    renderer.draw_image(
      this.image!,
      {
        x: sprite.frame.x,
        y: sprite.frame.y,
        width: sprite.frame.w,
        height: sprite.frame.h,
      },
      {
        x: 300.0,
        y: 300.0,
        width: sprite.frame.w,
        height: sprite.frame.h,
      }
    );
  }
}
