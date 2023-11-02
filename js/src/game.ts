import { fetch_json } from "./browser";
import { IGame, IPoint, IRect, ISheet, KeyState, Renderer, load_image, Image, SpriteSheet } from "./engine";
import { IObstacle } from "./obstacles";
import { RedHatBoy } from "./red_hat_boy";

const TIMELINE_MINIMUM: number = 1000;
const OBSTACLE_BUFFER: number = 20;

function rightmost(obstacle_list: Array<IObstacle>): number {
  return obstacle_list.map((obstacle) => obstacle.right()).reduce((a, b) => (b > a ? b : a), 0);
}

interface IWalk {
  obstacle_sheet: SpriteSheet;
  boy: RedHatBoy;
  backgrounds: [Image, Image];
  obstacles: Array<IObstacle>;
  stone: HTMLImageElement;
  timeline: number;
}

class Walk implements IWalk {
  constructor(
    public boy: RedHatBoy,
    public backgrounds: [Image, Image],
    public obstacles: Array<IObstacle>,
    public obstacle_sheet: SpriteSheet,
    public stone: HTMLImageElement,
    public timeline: number
  ) {}

  velocity(): number {
    return -this.boy.walking_speed();
  }

  generate_next_segment(): void {
    const next_segment = Math.floor(Math.random() * 3);
    let next_obstacles;
    switch (next_segment) {
      case 0:
        next_obstacles = stone_and_platform(this.stone, this.obstacle_sheet, this.timeline + OBSTACLE_BUFFER);
        break;
      case 1:
        next_obstacles = platform_and_stone(this.stone, this.obstacle_sheet, this.timeline + OBSTACLE_BUFFER);
        break;
      default:
        next_obstacles = [];
    }
    this.timeline = rightmost(next_obstacles);
    this.obstacles.push(...next_obstacles);
  }

  draw(renderer: Renderer): void {
    this.backgrounds.forEach((background) => {
      background.draw(renderer);
    });
    this.boy.draw(renderer);
    this.obstacles.forEach((obstacle) => {
      obstacle.draw(renderer);
    });
  }

  knocked_out(): boolean {
    return this.boy.knocked_out();
  }

  static reset(walk: Walk): Walk {
    const starting_obstacles = stone_and_platform(walk.stone, walk.obstacle_sheet, 0);
    const timeline = rightmost(starting_obstacles);

    return new Walk(
      RedHatBoy.reset(walk.boy),
      walk.backgrounds,
      starting_obstacles,
      walk.obstacle_sheet,
      walk.stone,
      timeline
    );
  }
}

enum ReadyEndState {
  Complete,
  Continue,
}

enum GameOverEndState {
  Complete,
  Continue,
}



enum WalkTheDogStateType {
  Ready,
  Walking,
  GameOver,
}

interface IWalkTheDogState {
 type: WalkTheDogStateType;
 walk: Walk;
}

class WalkingWalkTheDogState implements IWalkTheDogState {
  type = WalkTheDogStateType.Walking;
  constructor(public walk: Walk) {}
}

class ReadyWalkTheDogState implements IWalkTheDogState {
  type = WalkTheDogStateType.Ready;
  constructor(public walk: Walk) {}

  update(keystate: KeyState): ReadyWalkTheDogState | WalkingWalkTheDogState {
    this.walk.boy.update();
    if (keystate.is_pressed("ArrowRight")) {
      return this.start_running();
    } else {
      return this;
    }
  }

start_running(): WalkingWalkTheDogState {
    this.run_right();
    return new WalkingWalkTheDogState(this.walk);
  } 

run_right(): void {
    this.walk.boy.run_right();
  }
}

class GameOverWalkTheDogState implements IWalkTheDogState {
  type = WalkTheDogStateType.GameOver;
  constructor(public walk: Walk) {}
}



class WalkTheDogStateMachine {
  private state: IWalkTheDogState;

  constructor(walk: Walk) {
    this.state = new ReadyWalkTheDogState(walk);
  }
  
  update(keystate: KeyState): WalkTheDogStateMachine {
    if (this.state.type === WalkTheDogStateType.Ready) {
      this.state = (<ReadyWalkTheDogState>this.state).update(keystate);
    } else if (this.state.type === WalkTheDogStateType.Walking) {
      this.state = (<WalkingWalkTheDogState>this.state).update(keystate);
    } else if (this.state.type === WalkTheDogStateType.GameOver) {
      this.state = (<GameOverWalkTheDogState>this.state).update();
    }
    return this;
  }

  fn draw(&self, renderer: &Renderer) {
      match self {
          WalkTheDogStateMachine::Ready(state) => state.draw(renderer),
          WalkTheDogStateMachine::Walking(state) => state.draw(renderer),
          WalkTheDogStateMachine::GameOver(state) => state.draw(renderer),
      }
  }

  fn new(walk: Walk) -> Self {
      WalkTheDogStateMachine::Ready(WalkTheDogState::new(walk))
  }
}


export class WalkTheDog implements IWalkTheDog, IGame {
  state: WalkTheDogState = WalkTheDogState.Loading;
  walk: Walk;

  draw(renderer: Renderer): void {
    this.walk.draw(renderer);
  }

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
          if (this.walk.boy.velocity_y() > 0 && this.walk.boy.pos_y() < this.walk.platform.position.y) {
            this.walk.boy.land_on(bounding_box.y);
          } else {
            this.walk.boy.knock_out();
          }
        }
      }
      if (this.walk.boy.bounding_box().intersects(this.walk.stone.bounding_box)) {
        this.walk.boy.knock_out();
      }
    }
  }
}
