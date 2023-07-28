use web_sys::HtmlImageElement;

use crate::{red_hat_boy_states::{RedHatBoyState, Idle, Running, Sliding, Jumping, Falling, KnockedOut, RedHatBoyContext, SlidingEndState, JumpingEndState, FallingEndState}, engine::{Sheet, Cell, Renderer, Rect}};

pub enum Event {
	Run,
	Slide,
	Update,
	Jump,
	KnockOut,
	Land(i16),
}

#[derive(Copy, Clone)]
enum RedHatBoyStateMachine {
	Idle(RedHatBoyState<Idle>),
	Running(RedHatBoyState<Running>),
	Sliding(RedHatBoyState<Sliding>),
	Jumping(RedHatBoyState<Jumping>),
	Falling(RedHatBoyState<Falling>),
	KnockedOut(RedHatBoyState<KnockedOut>),
}

impl RedHatBoyStateMachine {
	fn transition(self, event: Event) -> Self {
			match (self, event) {
					(RedHatBoyStateMachine::Idle(state), Event::Run) => state.run().into(),
					(RedHatBoyStateMachine::Idle(state), Event::Update) => state.update().into(),
					(RedHatBoyStateMachine::Running(state), Event::Land(position)) => {
							state.land_on(position).into()
					}
					(RedHatBoyStateMachine::Running(state), Event::Slide) => state.slide().into(),
					(RedHatBoyStateMachine::Running(state), Event::KnockOut) => state.knock_out().into(),
					(RedHatBoyStateMachine::Running(state), Event::Update) => state.update().into(),
					(RedHatBoyStateMachine::Running(state), Event::Jump) => state.jump().into(),
					(RedHatBoyStateMachine::Sliding(state), Event::Land(position)) => {
							state.land_on(position).into()
					}
					(RedHatBoyStateMachine::Sliding(state), Event::Update) => state.update().into(),
					(RedHatBoyStateMachine::Sliding(state), Event::KnockOut) => state.knock_out().into(),
					(RedHatBoyStateMachine::Jumping(state), Event::Land(position)) => {
							state.land_on(position).into()
					}
					(RedHatBoyStateMachine::Jumping(state), Event::Update) => state.update().into(),
					(RedHatBoyStateMachine::Jumping(state), Event::KnockOut) => state.knock_out().into(),
					(RedHatBoyStateMachine::Falling(state), Event::Update) => state.update().into(),
					_ => self,
			}
	}

	fn frame_name(&self) -> &str {
			match self {
					RedHatBoyStateMachine::Idle(state) => state.frame_name(),
					RedHatBoyStateMachine::Running(state) => state.frame_name(),
					RedHatBoyStateMachine::Sliding(state) => state.frame_name(),
					RedHatBoyStateMachine::Jumping(state) => state.frame_name(),
					RedHatBoyStateMachine::Falling(state) => state.frame_name(),
					RedHatBoyStateMachine::KnockedOut(state) => state.frame_name(),
			}
	}

	fn context(&self) -> &RedHatBoyContext {
			match self {
					RedHatBoyStateMachine::Idle(state) => &state.context(),
					RedHatBoyStateMachine::Running(state) => &state.context(),
					RedHatBoyStateMachine::Sliding(state) => &state.context(),
					RedHatBoyStateMachine::Jumping(state) => &state.context(),
					RedHatBoyStateMachine::Falling(state) => &state.context(),
					RedHatBoyStateMachine::KnockedOut(state) => &state.context(),
			}
	}

	fn update(self) -> Self {
			self.transition(Event::Update)
	}
}

impl From<RedHatBoyState<Idle>> for RedHatBoyStateMachine {
	fn from(state: RedHatBoyState<Idle>) -> Self {
			RedHatBoyStateMachine::Idle(state)
	}
}

impl From<RedHatBoyState<Running>> for RedHatBoyStateMachine {
	fn from(state: RedHatBoyState<Running>) -> Self {
			RedHatBoyStateMachine::Running(state)
	}
}

impl From<RedHatBoyState<Sliding>> for RedHatBoyStateMachine {
	fn from(state: RedHatBoyState<Sliding>) -> Self {
			RedHatBoyStateMachine::Sliding(state)
	}
}

impl From<SlidingEndState> for RedHatBoyStateMachine {
	fn from(end_state: SlidingEndState) -> Self {
			match end_state {
					SlidingEndState::Complete(running_state) => running_state.into(),
					SlidingEndState::Sliding(sliding_state) => sliding_state.into(),
			}
	}
}

impl From<RedHatBoyState<Jumping>> for RedHatBoyStateMachine {
	fn from(state: RedHatBoyState<Jumping>) -> Self {
			RedHatBoyStateMachine::Jumping(state)
	}
}

impl From<JumpingEndState> for RedHatBoyStateMachine {
	fn from(end_state: JumpingEndState) -> Self {
			match end_state {
					JumpingEndState::Complete(running_state) => running_state.into(),
					JumpingEndState::Jumping(jumping_state) => jumping_state.into(),
			}
	}
}

impl From<RedHatBoyState<Falling>> for RedHatBoyStateMachine {
	fn from(state: RedHatBoyState<Falling>) -> Self {
			RedHatBoyStateMachine::Falling(state)
	}
}

impl From<FallingEndState> for RedHatBoyStateMachine {
	fn from(end_state: FallingEndState) -> Self {
			match end_state {
					FallingEndState::Complete(running_state) => running_state.into(),
					FallingEndState::Falling(sliding_state) => sliding_state.into(),
			}
	}
}

impl From<RedHatBoyState<KnockedOut>> for RedHatBoyStateMachine {
	fn from(state: RedHatBoyState<KnockedOut>) -> Self {
			RedHatBoyStateMachine::KnockedOut(state)
	}
}

pub struct RedHatBoy {
	state_machine: RedHatBoyStateMachine,
	sprite_sheet: Sheet,
	image: HtmlImageElement,
}

impl RedHatBoy {
	pub fn new(sheet: Sheet, image: HtmlImageElement) -> Self {
			RedHatBoy {
					state_machine: RedHatBoyStateMachine::Idle(RedHatBoyState::new()),
					sprite_sheet: sheet,
					image,
			}
	}

	fn frame_name(&self) -> String {
			format!(
					"{} ({}).png",
					self.state_machine.frame_name(),
					(self.state_machine.context().frame / 3) + 1
			)
	}

	fn current_sprite(&self) -> Option<&Cell> {
			self.sprite_sheet.frames.get(&self.frame_name())
	}

	pub fn draw(&self, renderer: &Renderer) {
			let sprite = self.current_sprite().expect("Cell not found");
			renderer.draw_image(
					&self.image,
					&Rect::new_from_x_y(
							sprite.frame.x.into(),
							sprite.frame.y.into(),
							sprite.frame.w.into(),
							sprite.frame.h.into(),
					),
					&self.destination_box(),
			);
	}

	fn destination_box(&self) -> Rect {
			let sprite = self.current_sprite().expect("Cell not found");
			Rect::new_from_x_y(
					(self.state_machine.context().position.x + sprite.sprite_source_size.x).into(),
					(self.state_machine.context().position.y + sprite.sprite_source_size.y).into(),
					sprite.frame.w.into(),
					sprite.frame.h.into(),
			)
	}

	pub fn bounding_box(&self) -> Rect {
			const X_OFFSET: i16 = 18;
			const Y_OFFSET: i16 = 14;
			const WIDTH_OFFSET: i16 = 28;
			let mut bounding_box = self.destination_box();
			bounding_box.set_x(bounding_box.x() + X_OFFSET);
			bounding_box.width -= WIDTH_OFFSET;
			bounding_box.set_y(bounding_box.y() + Y_OFFSET);
			bounding_box.height -= Y_OFFSET;
			bounding_box
	}

	pub fn update(&mut self) {
			self.state_machine = self.state_machine.update();
	}

	pub fn run_right(&mut self) {
			self.state_machine = self.state_machine.transition(Event::Run);
	}

	pub fn slide(&mut self) {
			self.state_machine = self.state_machine.transition(Event::Slide);
	}

	pub fn jump(&mut self) {
			self.state_machine = self.state_machine.transition(Event::Jump);
	}

	pub fn land_on(&mut self, position: i16) {
			self.state_machine = self.state_machine.transition(Event::Land(position));
	}

	pub fn knock_out(&mut self) {
			self.state_machine = self.state_machine.transition(Event::KnockOut);
	}

	pub fn pos_y(&self) -> i16 {
			self.state_machine.context().position.y
	}

	pub fn velocity_y(&self) -> i16 {
			self.state_machine.context().velocity.y
	}

	pub fn walking_speed(&self) -> i16 {
			self.state_machine.context().velocity.x
	}
}
