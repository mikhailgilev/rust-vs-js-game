use std::rc::Rc;

use crate::browser;
use crate::engine::{load_image, Game, Image, KeyState, Point, Rect, Renderer, Sheet, SpriteSheet};
use crate::obstacles::Obstacle;
use crate::red_hat_boy::RedHatBoy;
use crate::segments::{stone_and_platform, platform_and_stone};
use anyhow::{anyhow, Result};
use async_trait::async_trait;
use rand::{thread_rng, Rng};
use web_sys::HtmlImageElement;

const TIMELINE_MINIMUM: i16 = 1000;
const OBSTACLE_BUFFER: i16 = 20;

fn rightmost(obstacle_list: &Vec<Box<dyn Obstacle>>) -> i16 {
    obstacle_list
        .iter()
        .map(|obstacle| obstacle.right())
        .max_by(|x, y| x.cmp(&y))
        .unwrap_or(0)
}

pub struct Walk {
    obstacle_sheet: Rc<SpriteSheet>,
    boy: RedHatBoy,
    backgrounds: [Image; 2],
    obstacles: Vec<Box<dyn Obstacle>>,
    stone: HtmlImageElement,
    timeline: i16,
}

impl Walk {
    fn velocity(&self) -> i16 {
        -self.boy.walking_speed()
    }

    fn generate_next_segment(&mut self) {
        let mut rng = thread_rng();
        let next_segment = rng.gen_range(0..2);
        let mut next_obstacles = match next_segment {
            0 => stone_and_platform(
                self.stone.clone(),
                self.obstacle_sheet.clone(),
                self.timeline + OBSTACLE_BUFFER,
            ),
            1 => platform_and_stone(
                self.stone.clone(),
                self.obstacle_sheet.clone(),
                self.timeline + OBSTACLE_BUFFER,
            ),
            _ => vec![],
        };
        self.timeline = rightmost(&next_obstacles);
        self.obstacles.append(&mut next_obstacles);
    }
}

pub enum WalkTheDog {
    Loading,
    Loaded(Walk),
}

impl WalkTheDog {
    pub fn new() -> Self {
        WalkTheDog::Loading
    }
}

#[async_trait(?Send)]
impl Game for WalkTheDog {
    async fn initialize(&self) -> Result<Box<dyn Game>> {
        match self {
            WalkTheDog::Loading => {
                let json = browser::fetch_json("rhb.json").await?;
                let rhb = RedHatBoy::new(json.into_serde::<Sheet>()?, load_image("rhb.png").await?);
                let background = load_image("BG.png").await?;
                let background_width = background.width() as i16;
                let stone = load_image("Stone.png").await?;
                let tiles_json = browser::fetch_json("tiles.json").await?;
                let tiles = Rc::new(SpriteSheet::new(
                    tiles_json.into_serde::<Sheet>()?,
                    load_image("tiles.png").await?,
                ));
                let starting_obstacles = stone_and_platform(stone.clone(), tiles.clone(), 0);
                let timeline = rightmost(&starting_obstacles);

                Ok(Box::new(WalkTheDog::Loaded(Walk {
                    obstacle_sheet: tiles,
                    boy: rhb,
                    backgrounds: [
                        Image::new(background.clone(), Point { x: 0, y: 0 }),
                        Image::new(
                            background.clone(),
                            Point {
                                x: background_width,
                                y: 0,
                            },
                        ),
                    ],
                    obstacles: starting_obstacles,
                    stone,
                    timeline,
                })))
            }
            WalkTheDog::Loaded(_) => Err(anyhow!("Error: Game is already initialized!")),
        }
    }

    fn update(&mut self, keystate: &KeyState) {
        if let WalkTheDog::Loaded(walk) = self {
            let mut velocity = Point { x: 0, y: 0 };
            if keystate.is_pressed("ArrowDown") {
                walk.boy.slide();
            }
            if keystate.is_pressed("ArrowUp") {
                velocity.y -= 3;
            }
            if keystate.is_pressed("ArrowRight") {
                velocity.x += 3;
                walk.boy.run_right();
            }
            if keystate.is_pressed("ArrowLeft") {
                velocity.x -= 3;
            }
            if keystate.is_pressed("Space") {
                walk.boy.jump();
            }
            walk.boy.update();
            let velocity = walk.velocity();
            let [first_background, second_background] = &mut walk.backgrounds;
            first_background.move_horizontally(velocity);
            second_background.move_horizontally(velocity);
            if first_background.right() < 0 {
                first_background.set_x(second_background.right());
            }
            if second_background.right() < 0 {
                second_background.set_x(first_background.right());
            }
            walk.obstacles.retain(|obstacle| obstacle.right() > 0);
            walk.obstacles.iter_mut().for_each(|obstacle| {
                obstacle.move_horizontally(velocity);
                obstacle.check_intersection(&mut walk.boy);
            });
            if walk.timeline < TIMELINE_MINIMUM {
                walk.generate_next_segment()
            } else {
                walk.timeline += velocity;
            }
        }
    }

    fn draw(&self, renderer: &Renderer) {
        renderer.clear(&Rect::new_from_x_y(0, 0, 600, 570));
        if let WalkTheDog::Loaded(walk) = self {
            walk.backgrounds.iter().for_each(|background| {
                background.draw(renderer);
            });
            walk.boy.draw(renderer);
            walk.obstacles.iter().for_each(|obstacle| {
                obstacle.draw(renderer);
            });
        }
    }
}
