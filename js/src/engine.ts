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

export interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Rect implements IRect {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  intersects(rect: IRect): boolean {
    return (
      this.x < rect.x + rect.width &&
      this.x + this.width > rect.x &&
      this.y < rect.y + rect.height &&
      this.y + this.height > rect.y
    );
  }
}

export interface ISheetRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ICell {
  frame: ISheetRect;
  spriteSourceSize: ISheetRect;
}

export interface ISheet {
  frames: Record<string, ICell>;
}

export interface IImage {
  element: HTMLImageElement;
  position: IPoint;
  bounding_box: IRect;
}

export class Image implements IImage {
  element: HTMLImageElement;
  position: IPoint;
  bounding_box: IRect;

  constructor(element: HTMLImageElement, position: IPoint) {
    this.element = element;
    this.position = position;
    this.bounding_box = new Rect(
      position.x,
      position.y,
      element.width,
      element.height
    );
  }

  draw(renderer: Renderer): void {
    renderer.draw_entire_image(this.element, this.position);
  }
}

export interface IPoint {
  x: number;
  y: number;
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

  draw_entire_image(image: HTMLImageElement, position: IPoint): void {
    this.context.drawImage(image, position.x, position.y);
  }
}

export interface IGame {
  initialize(): void;
  update(keystate: KeyState): void;
  draw(renderer: IRenderer): void;
}

const FRAME_SIZE: number = (1.0 / 60.0) * 1000.0;

enum KeyPress {
  KeyUp,
  KeyDown,
}

interface IKeyState {
  pressed_keys: Map<string, KeyboardEvent>;
}

export class KeyState implements IKeyState {
  pressed_keys: Map<string, KeyboardEvent>;

  constructor() {
    this.pressed_keys = new Map();
  }

  is_pressed(code: string): boolean {
    return this.pressed_keys.has(code);
  }

  set_pressed(code: string, event: KeyboardEvent): void {
    this.pressed_keys.set(code, event);
  }

  set_released(code: string): void {
    this.pressed_keys.delete(code);
  }
}

export function prepare_input(): KeyState {
  let state = new KeyState();
  window.onkeydown = (event: KeyboardEvent) => {
    state.set_pressed(event.code, event);
  };
  window.onkeyup = (event: KeyboardEvent) => {
    state.set_released(event.code);
  };
  return state;
}

interface IGameLoop {
  last_frame: number;
  accumulated_delta: number;
}

export class GameLoop implements IGameLoop {
  last_frame: number = now();
  accumulated_delta: number = 0.0;
  async start(game: IGame): Promise<void> {
    let keystate = prepare_input();
    let gameImpl = await game.initialize();
    let renderer = new Renderer();
    let animate = (perf: number) => {
      this.accumulated_delta += perf - this.last_frame;
      while (this.accumulated_delta > FRAME_SIZE) {
        game.update(keystate);
        this.accumulated_delta -= FRAME_SIZE;
      }
      this.last_frame = perf;
      game.draw(renderer);
      request_animation_frame(animate);
    };
    request_animation_frame(animate);
  }
}
