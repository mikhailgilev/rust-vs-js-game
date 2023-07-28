use std::rc::Rc;

use crate::{engine::{Cell, Renderer, SpriteSheet, Rect, Point, Image}, red_hat_boy::RedHatBoy};

pub const LOW_PLATFORM: i16 = 420;
pub const HIGH_PLATFORM: i16 = 375;
pub const FIRST_PLATFORM: i16 = 200;

pub const FLOATING_PLATFORM_SPRITES: [&str; 3] = ["13.png", "14.png", "15.png"];
pub const FLOATING_PLATFORM_BOUNDING_BOXES: [Rect; 3] = [
    Rect::new_from_x_y(0, 0, 60, 54),
    Rect::new_from_x_y(60, 0, 384 - (60 * 2), 93),
    Rect::new_from_x_y(384 - 60, 0, 60, 54),
];

pub trait Obstacle {
	fn check_intersection(&self, boy: &mut RedHatBoy);
	fn draw(&self, renderer: &Renderer);
	fn move_horizontally(&mut self, x: i16);
	fn right(&self) -> i16;
}

pub struct Platform {
	sheet: Rc<SpriteSheet>,
	bounding_boxes: Vec<Rect>,
	sprites: Vec<Cell>,
	position: Point,
}

impl Platform {
	pub fn new(
			sheet: Rc<SpriteSheet>,
			position: Point,
			sprite_names: &[&str],
			bounding_boxes: &[Rect],
	) -> Self {
			let sprites = sprite_names
					.iter()
					.filter_map(|sprite_name| sheet.cell(sprite_name).cloned())
					.collect();
			let bounding_boxes = bounding_boxes
					.iter()
					.map(|bounding_box| {
							Rect::new_from_x_y(
									bounding_box.x() + position.x,
									bounding_box.y() + position.y,
									bounding_box.width,
									bounding_box.height,
							)
					})
					.collect();
			Platform {
					sheet,
					position,
					sprites,
					bounding_boxes,
			}
	}

	fn bounding_boxes(&self) -> &Vec<Rect> {
			&self.bounding_boxes
	}
}

impl Obstacle for Platform {
	fn draw(&self, renderer: &Renderer) {
			let mut x = 0;
			self.sprites.iter().for_each(|sprite| {
					self.sheet.draw(
							renderer,
							&Rect::new_from_x_y(
									sprite.frame.x,
									sprite.frame.y,
									sprite.frame.w,
									sprite.frame.h,
							),
							&Rect::new_from_x_y(
									self.position.x + x,
									self.position.y,
									sprite.frame.w,
									sprite.frame.h,
							),
					);
					x += sprite.frame.w;
			});
	}

	fn move_horizontally(&mut self, x: i16) {
			self.position.x += x;
			self.bounding_boxes.iter_mut().for_each(|bounding_box| {
					bounding_box.set_x(bounding_box.x() + x);
			})
	}

	fn check_intersection(&self, boy: &mut RedHatBoy) {
			if let Some(box_to_land_on) = self
					.bounding_boxes()
					.iter()
					.find(|&bounding_box| boy.bounding_box().intersects(bounding_box))
			{
					if boy.velocity_y() > 0 && boy.pos_y() < self.position.y {
							boy.land_on(box_to_land_on.y());
					} else {
							boy.knock_out();
					}
			}
	}

	fn right(&self) -> i16 {
			self.bounding_boxes()
					.last()
					.unwrap_or(&Rect::default())
					.right()
	}
}

pub struct Barrier {
	image: Image,
}

impl Barrier {
	pub fn new(image: Image) -> Self {
			Barrier { image }
	}
}

impl Obstacle for Barrier {
	fn check_intersection(&self, boy: &mut RedHatBoy) {
			if boy.bounding_box().intersects(self.image.bounding_box()) {
					boy.knock_out();
			}
	}

	fn draw(&self, renderer: &Renderer) {
			self.image.draw(renderer);
	}

	fn move_horizontally(&mut self, x: i16) {
			self.image.move_horizontally(x);
	}

	fn right(&self) -> i16 {
			self.image.right()
	}
}

