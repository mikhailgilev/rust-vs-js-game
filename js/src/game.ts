import { fetch_json } from "./browser";
import {
  IGame,
  IPoint,
  IRenderer,
  ISheet,
  KeyState,
  Renderer,
  load_image,
} from "./engine";
import {
  IdleRedHatBoyState,
  RedHatBoyContext,
  RedHatBoyState,
  RunningRedHatBoyState,
} from "./red_hat_boy_states";

enum Event {
  Run,
  Slide,
  Update,
  Jump,
}

class RedHatBoyStateMachine {
  private state: RedHatBoyState;

  constructor(state: RedHatBoyState) {
    this.state = state;
  }

  transition(event: Event): RedHatBoyStateMachine {
    if (this.state instanceof IdleRedHatBoyState && event === Event.Run) {
      this.state = (<IdleRedHatBoyState>this.state).run();
    }
    if (this.state instanceof RunningRedHatBoyState && event === Event.Slide) {
      this.state = (<RunningRedHatBoyState>this.state).slide();
    }
    if (this.state instanceof RunningRedHatBoyState && event === Event.Jump) {
      this.state = (<RunningRedHatBoyState>this.state).jump();
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

  draw(renderer: Renderer) {
    let frame_name = `${this.state_machine.frame_name()} (${Math.floor(
      this.state_machine.context().frame / 3 + 1
    )}).png`;
    let sprite = this.sprite_sheet.frames[frame_name];
    renderer.draw_image(
      this.image,
      {
        x: sprite.frame.x,
        y: sprite.frame.y,
        width: sprite.frame.w,
        height: sprite.frame.h,
      },
      {
        x: this.state_machine.context().position.x,
        y: this.state_machine.context().position.y,
        width: sprite.frame.w,
        height: sprite.frame.h,
      }
    );
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
}

enum WalkTheDogState {
  Loading,
  Loaded,
}

interface IWalkTheDog {
  state: WalkTheDogState;
  rhb: RedHatBoy | undefined;
}

export class WalkTheDog implements IWalkTheDog, IGame {
  state: WalkTheDogState = WalkTheDogState.Loading;
  rhb: RedHatBoy | undefined = undefined;

  async initialize(): Promise<void> {
    if (this.state === WalkTheDogState.Loading) {
      let sheet = await fetch_json("rhb.json");
      let image = await load_image("rhb.png");
      this.rhb = new RedHatBoy(sheet, image);
      this.state = WalkTheDogState.Loaded;
    }
  }

  update(keystate: KeyState): void {
    if (this.state === WalkTheDogState.Loaded && this.rhb !== undefined) {
      let velocity: IPoint = { x: 0, y: 0 };
      if (keystate.is_pressed("ArrowDown")) {
        this.rhb.slide();
      }
      if (keystate.is_pressed("ArrowUp")) {
        velocity.y -= 3;
      }
      if (keystate.is_pressed("ArrowRight")) {
        velocity.x += 3;
        this.rhb.run_right();
      }
      if (keystate.is_pressed("ArrowLeft")) {
        velocity.x -= 3;
      }
      if (keystate.is_pressed("Space")) {
        this.rhb.jump();
      }
      this.rhb.update();
    }
  }

  draw(renderer: Renderer): void {
    renderer.clear({
      x: 0.0,
      y: 0.0,
      width: 570.0,
      height: 570.0,
    });
    if (this.state === WalkTheDogState.Loaded && this.rhb !== undefined) {
      this.rhb.draw(renderer);
    }
  }
}
