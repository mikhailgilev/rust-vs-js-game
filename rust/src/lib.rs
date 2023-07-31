use engine::GameLoop;
use game::WalkTheDog;
use wasm_bindgen::prelude::*;

#[macro_use]
mod browser;
mod engine;
mod game;
mod red_hat_boy;
mod red_hat_boy_states;
mod segments;
mod obstacles;
mod sound;

// This is like the `main` function, except for JavaScript.
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    console_error_panic_hook::set_once();
    browser::spawn_local(async move {
        let game = WalkTheDog::new();
        GameLoop::start(game).await.expect("Coult not start game loop");
    });
    Ok(())
}
