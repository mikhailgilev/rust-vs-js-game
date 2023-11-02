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
  bounding_box_rect: IRect;
}

export class Image implements IImage {
  element: HTMLImageElement;
  bounding_box_rect: Rect;

  constructor(element: HTMLImageElement, position: IPoint) {
    this.element = element;
    this.bounding_box_rect = new Rect(
      position.x,
      position.y,
      element.width,
      element.height
    );
  }

  draw(renderer: Renderer): void {
    renderer.draw_entire_image(this.element, this.bounding_box_rect.position);
  }

  get bounding_box(): IRect {
    return this.bounding_box_rect;
  }

  move_horizontally(distance: number): void {
    this.bounding_box_rect.set_x(this.bounding_box_rect.x() + distance);
  }

  set_x(x: number): void {
    this.bounding_box_rect.set_x(x);
  }

  right(): number {
    return this.bounding_box_rect.right();
  }
}

export interface IRect {
  position: IPoint;
  width: number;
  height: number;
}

export class Rect implements IRect {
  position: IPoint;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.position = { x, y };
    this.width = width;
    this.height = height;
  }

  static new_from_x_y(
    x: number,
    y: number,
    width: number,
    height: number
  ): Rect {
    return new Rect(x, y, width, height);
  }

  x(): number {
    return this.position.x;
  }

  y(): number {
    return this.position.y;
  }

  right(): number {
    return this.x() + this.width;
  }

  bottom(): number {
    return this.y() + this.height;
  }

  set_x(x: number): void {
    this.position.x = x;
  }

  set_y(y: number): void {
    this.position.y = y;
  }

  intersects(rect: Rect): boolean {
    return (
      this.x() < rect.right() &&
      this.right() > rect.x() &&
      this.y() < rect.bottom() &&
      this.bottom() > rect.y()
    );
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

  clear(rect: Rect): void {
    this.context.clearRect(rect.x(), rect.y(), rect.width, rect.height);
  }

  draw_image(image: HTMLImageElement, frame: Rect, destination: Rect): void {
    this.context.drawImage(
      image,
      frame.x(),
      frame.y(),
      frame.width,
      frame.height,
      destination.x(),
      destination.y(),
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

interface ISpriteSheet {
  sheet: ISheet;
  image: HTMLImageElement;
}

class SpriteSheet implements ISpriteSheet {
  sheet: ISheet;
  image: HTMLImageElement;

  constructor(sheet: ISheet, image: HTMLImageElement) {
    this.sheet = sheet;
    this.image = image;
  }

  cell(name: string): ICell {
    return this.sheet.frames[name];
  }

  draw(renderer: Renderer, source: Rect, destination: Rect): void {
    renderer.draw_image(this.image, source, destination);
  }
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
