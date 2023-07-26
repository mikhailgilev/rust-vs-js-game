import { fetch_json } from "./browser";
import {
  ICell,
  IGame,
  IPoint,
  IRect,
  ISheet,
  KeyState,
  Renderer,
  load_image,
  Image,
  Rect,
} from "./engine";
import {
  IdleRedHatBoyState,
  JumpingRedHatBoyState,
  RedHatBoyContext,
  RedHatBoyState,
  RunningRedHatBoyState,
  SlidingRedHatBoyState,
  StateType,
} from "./red_hat_boy_states";

enum Event {
  Run,
  Slide,
  Update,
  Jump,
  KnockOut,
  Land,
}

const LOW_PLATFORM: number = 420;
const HIGH_PLATFORM: number = 375;

class RedHatBoyStateMachine {
  private state: RedHatBoyState;

  constructor(state: RedHatBoyState) {
    this.state = state;
  }

  transition(event: Event, ...args: any[]): RedHatBoyStateMachine {
    if (this.state.type === StateType.Idle && event === Event.Run) {
      this.state = (<IdleRedHatBoyState>this.state).run();
    }
    if (this.state.type === StateType.Running && event === Event.Land) {
      this.state = (<RunningRedHatBoyState>this.state).land_on(args[0]);
    }
    if (this.state.type === StateType.Running && event === Event.Slide) {
      this.state = (<RunningRedHatBoyState>this.state).slide();
    }
    if (this.state.type === StateType.Running && event === Event.KnockOut) {
      this.state = (<RunningRedHatBoyState>this.state).knock_out();
    }
    if (this.state.type === StateType.Running && event === Event.Jump) {
      this.state = (<RunningRedHatBoyState>this.state).jump();
    }
    if (this.state.type === StateType.Sliding && event === Event.Land) {
      this.state = (<SlidingRedHatBoyState>this.state).land_on(args[0]);
    }
    if (this.state.type === StateType.Sliding && event === Event.KnockOut) {
      this.state = (<SlidingRedHatBoyState>this.state).knock_out();
    }
    if (this.state.type === StateType.Jumping && event === Event.Land) {
      this.state = (<JumpingRedHatBoyState>this.state).land_on(args[0]);
    }
    if (this.state.type === StateType.Jumping && event === Event.KnockOut) {
      this.state = (<JumpingRedHatBoyState>this.state).knock_out();
    }
    if (event === Event.Update) {
      this.state = this.state.update();
    }
    return this;
  }

  frame_name(): string {
    return this.state.frame_name();
  }

  context(): RedHatBoyContext {
    return this.state.context;
  }

  update(): RedHatBoyStateMachine {
    return this.transition(Event.Update);
  }
}

interface IPlatform {
  sheet: ISheet;
  image: HTMLImageElement;
  position: IPoint;
}

class Platform implements IPlatform {
  sheet: ISheet;
  image: HTMLImageElement;
  position: IPoint;

  constructor(sheet: ISheet, image: HTMLImageElement, position: IPoint) {
    this.sheet = sheet;
    this.image = image;
    this.position = position;
  }

  destination_box(): IRect {
    let platform = this.sheet.frames["13.png"];
    return {
      x: this.position.x,
      y: this.position.y,
      width: platform.frame.w * 3,
      height: platform.frame.h,
    };
  }

  draw(renderer: Renderer) {
    let platform = this.sheet.frames["13.png"];

    renderer.draw_image(
      this.image,
      {
        x: platform.frame.x,
        y: platform.frame.y,
        width: platform.frame.w * 3,
        height: platform.frame.h,
      },
      this.destination_box()
    );
  }

  bounding_boxes(): [IRect, IRect, IRect] {
    const X_OFFSET: number = 60.0;
    const END_HEIGHT: number = 54.0;
    let dest = this.destination_box();
    let bounding_box_one = {
      x: dest.x,
      y: dest.y,
      width: X_OFFSET,
      height: END_HEIGHT,
    };
    let bounding_box_two = {
      x: dest.x + X_OFFSET,
      y: dest.y,
      width: dest.width - X_OFFSET * 2.0,
      height: dest.height,
    };
    let bounding_box_three = {
      x: dest.x + dest.width - X_OFFSET,
      y: dest.y,
      width: X_OFFSET,
      height: END_HEIGHT,
    };
    return [bounding_box_one, bounding_box_two, bounding_box_three];
  }
}

interface IRedHatBoy {
  state_machine: RedHatBoyStateMachine;
  sprite_sheet: ISheet;
  image: HTMLImageElement;
}

class RedHatBoy implements IRedHatBoy {
  state_machine: RedHatBoyStateMachine;
  sprite_sheet: ISheet;
  image: HTMLImageElement;

  constructor(sheet: ISheet, image: HTMLImageElement) {
    this.sprite_sheet = sheet;
    this.image = image;
    this.state_machine = new RedHatBoyStateMachine(new IdleRedHatBoyState());
  }

  frame_name(): string {
    return `${this.state_machine.frame_name()} (${Math.floor(
      this.state_machine.context().frame / 3 + 1
    )}).png`;
  }

  current_sprite(): ICell {
    return this.sprite_sheet.frames[this.frame_name()];
  }

  draw(renderer: Renderer) {
    let sprite = this.current_sprite();
    renderer.draw_image(
      this.image,
      {
        x: sprite.frame.x,
        y: sprite.frame.y,
        width: sprite.frame.w,
        height: sprite.frame.h,
      },
      this.destination_box()
    );
  }

  destination_box(): Rect {
    let sprite = this.current_sprite();
    return new Rect(
      this.state_machine.context().position.x + sprite.spriteSourceSize.x,
      this.state_machine.context().position.y + sprite.spriteSourceSize.y,
      sprite.frame.w,
      sprite.frame.h
    );
  }

  bounding_box(): Rect {
    const X_OFFSET: number = 18.0;
    const Y_OFFSET: number = 14.0;
    const WIDTH_OFFSET: number = 28.0;
    let bounding_box = this.destination_box();
    bounding_box.x += X_OFFSET;
    bounding_box.width -= WIDTH_OFFSET;
    bounding_box.y += Y_OFFSET;
    bounding_box.height -= Y_OFFSET;
    return bounding_box;
  }

  update(): void {
    this.state_machine = this.state_machine.update();
  }

  run_right(): void {
    this.state_machine = this.state_machine.transition(Event.Run);
  }

  slide(): void {
    this.state_machine = this.state_machine.transition(Event.Slide);
  }

  jump(): void {
    this.state_machine = this.state_machine.transition(Event.Jump);
  }

  land_on(position: number) {
    this.state_machine = this.state_machine.transition(Event.Land, position);
  }

  knock_out() {
    this.state_machine = this.state_machine.transition(Event.KnockOut);
  }

  pos_y(): number {
    return this.state_machine.context().position.y;
  }

  velocity_y(): number {
    return this.state_machine.context().velocity.y;
  }
}

interface IWalk {
  boy: RedHatBoy;
  background: Image;
  stone: Image;
  platform: Platform;
}

enum WalkTheDogState {
  Loading,
  Loaded,
}

interface IWalkTheDog {
  state: WalkTheDogState;
  walk: IWalk | undefined;
}

export class WalkTheDog implements IWalkTheDog, IGame {
  state: WalkTheDogState = WalkTheDogState.Loading;
  walk: IWalk | undefined = undefined;

  async initialize(): Promise<void> {
    if (this.state === WalkTheDogState.Loading) {
      let sheet = await fetch_json("rhb.json");
      let image = await load_image("rhb.png");
      let background = await load_image("BG.png");
      let stone = await load_image("Stone.png");
      let platform_sheet = await fetch_json("tiles.json");
      let platform_image = await load_image("tiles.png");
      let platform = new Platform(platform_sheet, platform_image, {
        x: 200,
        y: LOW_PLATFORM,
      });
      this.walk = {
        boy: new RedHatBoy(sheet, image),
        background: new Image(background, { x: 0, y: 0 }),
        stone: new Image(stone, { x: 150, y: 516 }),
        platform,
      };
      this.state = WalkTheDogState.Loaded;
    }
  }

  update(keystate: KeyState): void {
    if (this.state === WalkTheDogState.Loaded && this.walk !== undefined) {
      let velocity: IPoint = { x: 0, y: 0 };
      if (keystate.is_pressed("ArrowDown")) {
        this.walk.boy.slide();
      }
      if (keystate.is_pressed("ArrowUp")) {
        velocity.y -= 3;
      }
      if (keystate.is_pressed("ArrowRight")) {
        velocity.x += 3;
        this.walk.boy.run_right();
      }
      if (keystate.is_pressed("ArrowLeft")) {
        velocity.x -= 3;
      }
      if (keystate.is_pressed("Space")) {
        this.walk.boy.jump();
      }
      this.walk.boy.update();

      for (let bounding_box of this.walk.platform.bounding_boxes()) {
        if (this.walk.boy.bounding_box().intersects(bounding_box)) {
          if (
            this.walk.boy.velocity_y() > 0 &&
            this.walk.boy.pos_y() < this.walk.platform.position.y
          ) {
            this.walk.boy.land_on(bounding_box.y);
          } else {
            this.walk.boy.knock_out();
          }
        }
      }
      if (
        this.walk.boy.bounding_box().intersects(this.walk.stone.bounding_box)
      ) {
        this.walk.boy.knock_out();
      }
    }
  }

  draw(renderer: Renderer): void {
    renderer.clear({
      x: 0.0,
      y: 0.0,
      width: 570.0,
      height: 570.0,
    });
    if (this.state === WalkTheDogState.Loaded && this.walk !== undefined) {
      this.walk.background.draw(renderer);
      this.walk.boy.draw(renderer);
      this.walk.stone.draw(renderer);
      this.walk.platform.draw(renderer);
    }
  }
}
