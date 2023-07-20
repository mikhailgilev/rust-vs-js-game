import { new_image, context, now, request_animation_frame } from "./browser";

export async function load_image(source: string): Promise<HTMLImageElement> {
  let image = new_image();
  image.src = source;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });
  return image;
}

interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IPoint {
  x: number,
  y: number,
}


export interface IRenderer {
  context: CanvasRenderingContext2D;
}

export class Renderer implements IRenderer {
  public context: CanvasRenderingContext2D = context();

  clear(rect: IRect): void {
    this.context.clearRect(rect.x, rect.y, rect.width, rect.height);
  }

  draw_image(image: HTMLImageElement, frame: IRect, destination: IRect): void {
    this.context.drawImage(
      image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      destination.x,
      destination.y,
      destination.width,
      destination.height
    );
  }
}

interface IGame {
  initialize(): void;
  update(): void;
  draw(renderer: IRenderer): void;
}

const FRAME_SIZE: number = (1.0 / 60.0) * 1000.0;

interface IGameLoop {
  last_frame: number;
  accumulated_delta: number;
}

export class GameLoop implements IGameLoop {
  last_frame: number = now();
  accumulated_delta: number = 0.0;
  async start(game: IGame): Promise<void> {
    let gameImpl = await game.initialize();
    let renderer = new Renderer();
    let animate = (perf: number) => {
      this.accumulated_delta += perf - this.last_frame;
      while (this.accumulated_delta > FRAME_SIZE) {
        game.update();
        this.accumulated_delta -= FRAME_SIZE;
      }
      this.last_frame = perf;
      game.draw(renderer);
      request_animation_frame(animate);
    };
    request_animation_frame(animate);
  }
}
