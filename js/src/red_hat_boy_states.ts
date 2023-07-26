import { IPoint } from "./engine";

const FLOOR: number = 445;
const HEIGHT: number = 570;
const PLAYER_HEIGHT: number = HEIGHT - FLOOR;
const STARTING_POINT: number = -20;

const IDLE_FRAME_NAME: string = "Idle";
const RUN_FRAME_NAME: string = "Run";
const SLIDING_FRAME_NAME: string = "Slide";
const JUMPING_FRAME_NAME: string = "Jump";
const FALLING_FRAME_NAME: string = "Dead";

const IDLE_FRAMES: number = 29;
const RUNNING_FRAMES: number = 23;
export const SLIDING_FRAMES: number = 14;
export const JUMPING_FRAMES: number = 35;
const FALLING_FRAMES: number = 29;

const RUNNING_SPEED: number = 4;
const JUMP_SPEED: number = -25;

const GRAVITY: number = 1;
const TERMINAL_VELOCITY: number = 20;

export interface IRedHatBoyContext {
  frame: number;
  position: IPoint;
  velocity: IPoint;
}

export class RedHatBoyContext implements IRedHatBoyContext {
  constructor(
    public frame: number,
    public position: IPoint,
    public velocity: IPoint
  ) {}

  update(frame_count: number): RedHatBoyContext {
    if (this.frame < frame_count) {
      this.frame += 1;
    } else {
      this.frame = 0;
    }
    if (this.velocity.y < TERMINAL_VELOCITY) {
      this.velocity.y += GRAVITY;
    }
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (this.position.y > FLOOR) {
      this.position.y = FLOOR;
    }
    return this;
  }

  reset_frame(): RedHatBoyContext {
    this.frame = 0;
    return this;
  }

  run_right(): RedHatBoyContext {
    this.velocity.x += RUNNING_SPEED;
    return this;
  }

  set_vertical_velocity(y: number): RedHatBoyContext {
    this.velocity.y = y;
    return this;
  }

  stop(): RedHatBoyContext {
    this.velocity.x = 0;
    return this;
  }

  set_on(position: number): RedHatBoyContext {
    position = position - PLAYER_HEIGHT;
    this.position.y = position;
    return this;
  }
}

export enum StateType {
  Idle,
  Running,
  Sliding,
  Jumping,
  Falling,
  KnockedOut,
}

export interface IRedHatBoyState {
  context: IRedHatBoyContext;
  type: StateType;
}

export class IdleRedHatBoyState implements IRedHatBoyState {
  context: RedHatBoyContext;
  type = StateType.Idle;

  constructor() {
    this.context = new RedHatBoyContext(
      0,
      { x: STARTING_POINT, y: FLOOR },
      { x: 0, y: 0 }
    );
  }

  run(): RunningRedHatBoyState {
    return new RunningRedHatBoyState(this.context.reset_frame().run_right());
  }

  frame_name(): string {
    return IDLE_FRAME_NAME;
  }

  update(): IdleRedHatBoyState {
    this.context = this.context.update(IDLE_FRAMES);
    return this;
  }
}

export class RunningRedHatBoyState implements IRedHatBoyState {
  context: RedHatBoyContext;
  type = StateType.Running;

  constructor(context: RedHatBoyContext) {
    this.context = context;
  }

  frame_name(): string {
    return RUN_FRAME_NAME;
  }

  update(): RunningRedHatBoyState {
    this.context = this.context.update(RUNNING_FRAMES);
    return this;
  }

  slide(): SlidingRedHatBoyState {
    return new SlidingRedHatBoyState(this.context.reset_frame());
  }

  jump(): JumpingRedHatBoyState {
    return new JumpingRedHatBoyState(
      this.context.set_vertical_velocity(JUMP_SPEED).reset_frame()
    );
  }

  knock_out(): FallingRedHatBoyState {
    return new FallingRedHatBoyState(this.context.reset_frame().stop());
  }

  land_on(position: number): RunningRedHatBoyState {
    return new RunningRedHatBoyState(this.context.set_on(position));
  }
}

export class SlidingRedHatBoyState implements IRedHatBoyState {
  context: RedHatBoyContext;
  type = StateType.Sliding;

  constructor(context: RedHatBoyContext) {
    this.context = context;
  }

  frame_name(): string {
    return SLIDING_FRAME_NAME;
  }

  update(): SlidingRedHatBoyState | RunningRedHatBoyState {
    this.context = this.context.update(SLIDING_FRAMES);
    if (this.context.frame >= SLIDING_FRAMES) {
      return this.stand();
    } else {
      return this;
    }
  }

  stand(): RunningRedHatBoyState {
    return new RunningRedHatBoyState(this.context.reset_frame());
  }

  knock_out(): FallingRedHatBoyState {
    return new FallingRedHatBoyState(this.context.reset_frame().stop());
  }

  land_on(position: number): SlidingRedHatBoyState {
    return new SlidingRedHatBoyState(this.context.set_on(position));
  }
}

export class JumpingRedHatBoyState {
  context: RedHatBoyContext;
  type = StateType.Jumping;

  constructor(context: RedHatBoyContext) {
    this.context = context;
  }

  frame_name(): string {
    return JUMPING_FRAME_NAME;
  }

  update(): JumpingRedHatBoyState | RunningRedHatBoyState {
    this.context = this.context.update(JUMPING_FRAMES);
    if (this.context.position.y >= FLOOR) {
      return this.land_on(HEIGHT);
    } else {
      return this;
    }
  }

  land_on(position: number): RunningRedHatBoyState {
    return new RunningRedHatBoyState(
      this.context.reset_frame().set_on(position)
    );
  }

  knock_out(): FallingRedHatBoyState {
    return new FallingRedHatBoyState(this.context.reset_frame().stop());
  }
}

export class FallingRedHatBoyState implements IRedHatBoyState {
  context: RedHatBoyContext;
  type = StateType.Falling;

  constructor(context: RedHatBoyContext) {
    this.context = context;
  }

  frame_name(): string {
    return FALLING_FRAME_NAME;
  }

  update(): FallingRedHatBoyState | KnockedOutRedHatBoyState {
    this.context = this.context.update(FALLING_FRAMES);
    if (this.context.frame >= FALLING_FRAMES) {
      return this.fall();
    } else {
      return this;
    }
  }

  fall(): KnockedOutRedHatBoyState {
    return new KnockedOutRedHatBoyState(this.context);
  }
}

export class KnockedOutRedHatBoyState implements IRedHatBoyState {
  context: RedHatBoyContext;
  type = StateType.KnockedOut;

  constructor(context: RedHatBoyContext) {
    this.context = context;
  }

  frame_name(): string {
    return FALLING_FRAME_NAME;
  }

  update(): KnockedOutRedHatBoyState {
    return this;
  }
}

export type RedHatBoyState =
  | IdleRedHatBoyState
  | RunningRedHatBoyState
  | SlidingRedHatBoyState
  | JumpingRedHatBoyState
  | FallingRedHatBoyState
  | KnockedOutRedHatBoyState;
