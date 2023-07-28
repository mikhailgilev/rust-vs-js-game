use std::rc::Rc;

use web_sys::HtmlImageElement;

use crate::{engine::{Image, Point, SpriteSheet}, obstacles::{Platform, FLOATING_PLATFORM_SPRITES, FLOATING_PLATFORM_BOUNDING_BOXES, Obstacle, Barrier, LOW_PLATFORM, FIRST_PLATFORM, HIGH_PLATFORM}};

fn create_floating_platform(sprite_sheet: Rc<SpriteSheet>, position: Point) -> Platform {
    Platform::new(
        sprite_sheet,
        position,
        &FLOATING_PLATFORM_SPRITES,
        &FLOATING_PLATFORM_BOUNDING_BOXES,
    )
}

pub fn stone_and_platform(
    stone: HtmlImageElement,
    sprite_sheet: Rc<SpriteSheet>,
    offset_x: i16,
) -> Vec<Box<dyn Obstacle>> {
    const INITIAL_STONE_OFFSET: i16 = 150;
    const STONE_ON_GROUND: i16 = 520;
    vec![
        Box::new(Barrier::new(Image::new(
            stone,
            Point {
                x: offset_x + INITIAL_STONE_OFFSET,
                y: STONE_ON_GROUND,
            },
        ))),
        Box::new(create_floating_platform(
            sprite_sheet,
            Point {
                x: offset_x + FIRST_PLATFORM,
                y: LOW_PLATFORM,
            },
        )),
    ]
}

pub fn platform_and_stone(
    stone: HtmlImageElement,
    sprite_sheet: Rc<SpriteSheet>,
    offset_x: i16,
) -> Vec<Box<dyn Obstacle>> {
    const INITIAL_STONE_OFFSET: i16 = 150;
    const STONE_ON_GROUND: i16 = 520;
    vec![
        Box::new(Barrier::new(Image::new(
            stone,
            Point {
                x: offset_x + FIRST_PLATFORM,
                y: STONE_ON_GROUND,
            },
        ))),
        Box::new(create_floating_platform(
            sprite_sheet,
            Point {
                x: offset_x + INITIAL_STONE_OFFSET,
                y: HIGH_PLATFORM,
            },
        )),
    ]
}
