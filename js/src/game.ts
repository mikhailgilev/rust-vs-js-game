import { draw_ui, fetch_json, find_html_element_by_id, hide_ui } from "./browser";
import { Audio, IGame, KeyState, Renderer, load_image, Image, SpriteSheet, add_click_handler, Rect } from "./engine";
import { IObstacle } from "./obstacles";
import { RedHatBoy } from "./red_hat_boy";
import { platform_and_stone, stone_and_platform } from "./segments";

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
    const next_segment = Math.floor(Math.random() * 2);
    let next_obstacles: Array<IObstacle>;
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

enum WalkTheDogStateType {
  Ready,
  Walking,
  GameOver,
}

interface IWalkTheDogState {
  type: WalkTheDogStateType;
  walk: Walk;
  draw(renderer: Renderer): void;
}

class WalkingWalkTheDogState implements IWalkTheDogState {
  type = WalkTheDogStateType.Walking;
  constructor(public walk: Walk) {}

  update(keystate: KeyState): WalkingWalkTheDogState | GameOverWalkTheDogState {
    if (keystate.is_pressed("ArrowDown")) {
      this.walk.boy.slide();
    }
    if (keystate.is_pressed("Space")) {
      this.walk.boy.jump();
    }
    this.walk.boy.update();
    let walking_speed = this.walk.velocity();
    let [first_background, second_background] = this.walk.backgrounds;
    first_background.move_horizontally(walking_speed);
    second_background.move_horizontally(walking_speed);
    if (first_background.right() < 0) {
      first_background.set_x(second_background.right());
    }
    if (second_background.right() < 0) {
      second_background.set_x(first_background.right());
    }
    this.walk.obstacles = this.walk.obstacles.filter((obstacle) => obstacle.right() > 0);
    this.walk.obstacles.forEach((obstacle) => {
      obstacle.move_horizontally(walking_speed);
      obstacle.check_intersection(this.walk.boy);
    });
    if (this.walk.timeline < TIMELINE_MINIMUM) {
      this.walk.generate_next_segment();
    } else {
      this.walk.timeline += walking_speed;
    }
    if (this.walk.knocked_out()) {
      return this.end_game();
    } else {
      return this;
    }
  }

  end_game(): GameOverWalkTheDogState {
    draw_ui("<button id='new_game'>New Game</button");
    const el = find_html_element_by_id("new_game");
    const nextState = new GameOverWalkTheDogState(this.walk);
    add_click_handler(el, () => (nextState.new_game_pressed = true));
    return nextState;
  }

  draw(renderer: Renderer): void {
    this.walk.draw(renderer);
  }
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

  draw(renderer: Renderer): void {
    this.walk.draw(renderer);
  }
}

class GameOverWalkTheDogState implements IWalkTheDogState {
  type = WalkTheDogStateType.GameOver;
  public new_game_pressed: boolean = false;

  constructor(public walk: Walk) {}

  update(): GameOverWalkTheDogState | ReadyWalkTheDogState {
    if (this.new_game_pressed) {
      return this.new_game();
    } else {
      return this;
    }
  }

  new_game(): ReadyWalkTheDogState {
    hide_ui();
    return new ReadyWalkTheDogState(Walk.reset(this.walk));
  }

  draw(renderer: Renderer): void {
    this.walk.draw(renderer);
  }
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

  draw(renderer: Renderer): void {
    this.state.draw(renderer);
  }
}

interface IWalkTheDog {
  machine: WalkTheDogStateMachine | undefined;
}

export class WalkTheDog implements IWalkTheDog, IGame {
  machine: WalkTheDogStateMachine | undefined;

  async initialize(): Promise<IGame> {
    if (this.machine === undefined) {
      let json = await fetch_json("rhb.json");
      let background = await load_image("BG.png");
      let background_width = background.width;
      let stone = await load_image("Stone.png");
      let tiles_json = await fetch_json("tiles.json");
      let tiles = new SpriteSheet(tiles_json, await load_image("tiles.png"));
      let starting_obstacles = stone_and_platform(stone, tiles, 0);
      let timeline = rightmost(starting_obstacles);
      let audio = new Audio();
      let sound = await audio.load_sound("SFX_Jump_23.mp3");
      let background_music = await audio.load_sound("background_song.mp3");
      audio.play_looping_sound(background_music);
      let rhb = new RedHatBoy(json, await load_image("rhb.png"), audio, sound);
      this.machine = new WalkTheDogStateMachine(
        new Walk(
          rhb,
          [
            new Image(background, { x: 0, y: 0 }),
            new Image(background, {
              x: background_width,
              y: 0,
            }),
          ],
          starting_obstacles,
          tiles,
          stone,
          timeline
        )
      );
      setTimeout(() => {});
    } else {
      throw new Error("State machine already exists");
    }
    return this;
  }

  update(keystate: KeyState): void {
    if (this.machine !== undefined) {
      this.machine = this.machine.update(keystate);
    }
  }

  draw(renderer: Renderer): void {
    renderer.clear(Rect.new_from_x_y(0, 0, 600, 570));
    if (this.machine !== undefined) {
      this.machine.draw(renderer);
    }
  }
}
