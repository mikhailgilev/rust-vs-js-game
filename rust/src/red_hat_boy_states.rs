use crate::engine::Point;

const FLOOR: i16 = 445;

const IDLE_FRAME_NAME: &str = "Idle";
const RUN_FRAME_NAME: &str = "Run";
const SLIDING_FRAME_NAME: &str = "Slide";
const JUMPING_FRAME_NAME: &str = "Jump";

const IDLE_FRAMES: u8 = 29;
const RUNNING_FRAMES: u8 = 23;
pub const SLIDING_FRAMES: u8 = 14;
pub const JUMPING_FRAMES: u8 = 35;

const RUNNING_SPEED: i16 = 3;
const JUMP_SPEED: i16 = -25;

const GRAVITY: i16 = 1;

#[derive(Copy, Clone)]
pub struct RedHatBoyState<S> {
    context: RedHatBoyContext,
    _state: S,
}

#[derive(Copy, Clone)]
pub struct RedHatBoyContext {
    pub frame: u8,
    pub position: Point,
    pub velocity: Point,
}

impl RedHatBoyContext {
    pub fn update(mut self, frame_count: u8) -> Self {
        if self.frame < frame_count {
            self.frame += 1;
        } else {
            self.frame = 0;
        }
        self.velocity.y += GRAVITY;
        self.position.x += self.velocity.x;
        self.position.y += self.velocity.y;
        if self.position.y > FLOOR {
            self.position.y = FLOOR;
        }
        self
    }

    fn reset_frame(mut self) -> Self {
        self.frame = 0;
        self
    }

    fn run_right(mut self) -> Self {
        self.velocity.x += RUNNING_SPEED;
        self
    }

    fn set_vertical_velocity(mut self, y: i16) -> Self {
        self.velocity.y = y;
        self
    }
}

#[derive(Copy, Clone)]
pub struct Idle;
#[derive(Copy, Clone)]
pub struct Running;

#[derive(Copy, Clone)]
pub struct Sliding;

#[derive(Copy, Clone)]
pub struct Jumping;

impl<S> RedHatBoyState<S> {
    pub fn context(&self) -> &RedHatBoyContext {
        &self.context
    }
}

impl RedHatBoyState<Idle> {
    pub fn run(self) -> RedHatBoyState<Running> {
        RedHatBoyState {
            context: self.context.reset_frame().run_right(),
            _state: Running {},
        }
    }
    pub fn new() -> Self {
        RedHatBoyState {
            context: RedHatBoyContext {
                frame: 0,
                position: Point { x: 0, y: FLOOR },
                velocity: Point { x: 0, y: 0 },
            },
            _state: Idle {},
        }
    }

    pub fn frame_name(&self) -> &str {
        IDLE_FRAME_NAME
    }

    pub fn update(mut self) -> Self {
        self.context = self.context.update(IDLE_FRAMES);
        self
    }
}

impl RedHatBoyState<Running> {
    pub fn frame_name(&self) -> &str {
        RUN_FRAME_NAME
    }

    pub fn update(mut self) -> Self {
        self.context = self.context.update(RUNNING_FRAMES);
        self
    }

    pub fn slide(self) -> RedHatBoyState<Sliding> {
        RedHatBoyState {
            context: self.context.reset_frame(),
            _state: Sliding {},
        }
    }

    pub fn jump(self) -> RedHatBoyState<Jumping> {
        RedHatBoyState {
            context: self.context.set_vertical_velocity(JUMP_SPEED).reset_frame(),
            _state: Jumping {},
        }
    }
}

impl RedHatBoyState<Sliding> {
    pub fn frame_name(&self) -> &str {
        SLIDING_FRAME_NAME
    }

    pub fn update(mut self) -> SlidingEndState {
        self.context = self.context.update(SLIDING_FRAMES);
        if self.context.frame >= SLIDING_FRAMES {
            SlidingEndState::Complete(self.stand())
        } else {
            SlidingEndState::Sliding(self)
        }
    }

    pub fn stand(self) -> RedHatBoyState<Running> {
        RedHatBoyState {
            context: self.context.reset_frame(),
            _state: Running,
        }
    }
}

impl RedHatBoyState<Jumping> {
    pub fn frame_name(&self) -> &str {
        JUMPING_FRAME_NAME
    }

    pub fn update(mut self) -> JumpingEndState {
        self.context = self.context.update(JUMPING_FRAMES);
        if self.context.position.y >= FLOOR {
            JumpingEndState::Complete(self.land())
        } else {
            JumpingEndState::Jumping(self)
        }
    }

    pub fn land(self) -> RedHatBoyState<Running> {
        RedHatBoyState {
            context: self.context.reset_frame(),
            _state: Running,
        }
    }
}

pub enum SlidingEndState {
    Complete(RedHatBoyState<Running>),
    Sliding(RedHatBoyState<Sliding>),
}

pub enum JumpingEndState {
    Complete(RedHatBoyState<Running>),
    Jumping(RedHatBoyState<Jumping>),
}
