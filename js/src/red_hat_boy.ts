import { ICell, ISheet, Rect, Renderer, Sound, Audio } from "./engine";
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

  knocked_out(): boolean {
    return this.state.type === StateType.KnockedOut;
  }
}

interface IRedHatBoy {
  state_machine: RedHatBoyStateMachine;
  sprite_sheet: ISheet;
  image: HTMLImageElement;
}

export class RedHatBoy implements IRedHatBoy {
  state_machine: RedHatBoyStateMachine;
  sprite_sheet: ISheet;
  image: HTMLImageElement;

  constructor(sheet: ISheet, image: HTMLImageElement, audio: Audio, jump_sound: Sound) {
    this.sprite_sheet = sheet;
    this.image = image;
    this.state_machine = new RedHatBoyStateMachine(new IdleRedHatBoyState(audio, jump_sound));
  }

  frame_name(): string {
    return `${this.state_machine.frame_name()} (${Math.floor(this.state_machine.context().frame / 3 + 1)}).png`;
  }

  current_sprite(): ICell {
    return this.sprite_sheet.frames[this.frame_name()];
  }

  draw(renderer: Renderer) {
    let sprite = this.current_sprite();
    renderer.draw_image(
      this.image,
      Rect.new_from_x_y(sprite.frame.x, sprite.frame.y, sprite.frame.w, sprite.frame.h),
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
    const X_OFFSET: number = 18;
    const Y_OFFSET: number = 14;
    const WIDTH_OFFSET: number = 28;
    let bounding_box = this.destination_box();
    bounding_box.set_x(bounding_box.x() + X_OFFSET);
    bounding_box.width -= WIDTH_OFFSET;
    bounding_box.set_y(bounding_box.y() + Y_OFFSET);
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

  walking_speed(): number {
    return this.state_machine.context().velocity.x;
  }

  knocked_out(): boolean {
    return this.state_machine.knocked_out();
  }

  static reset(boy: RedHatBoy): RedHatBoy {
    return new RedHatBoy(
      boy.sprite_sheet,
      boy.image,
      boy.state_machine.context().audio,
      boy.state_machine.context().jump_sound
    );
  }
}
