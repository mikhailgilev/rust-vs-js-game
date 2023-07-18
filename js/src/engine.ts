import { new_image, context } from "./browser";

export async function load_image(source: string): Promise<HTMLImageElement> {
  let image = new_image();
  image.src = source;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });
  return image;
}

interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IRenderer {
  context: CanvasRenderingContext2D;
}

class Renderer implements IRenderer {
  public context: CanvasRenderingContext2D = context();
  
  clear(rect: IRect) {
    this.context.clearRect(rect.x, rect.y, rect.width, rect.height);
  }
}
//     pub fn draw_image(&self, image: &HtmlImageElement, frame: &Rect, destination: &Rect) {
//         self.context
//             .draw_image_with_html_image_element_and_sw_and_sh_and_dx_and_dy_and_dw_and_dh(
//                 &image,
//                 frame.x.into(),
//                 frame.y.into(),
//                 frame.width.into(),
//                 frame.height.into(),
//                 destination.x.into(),
//                 destination.y.into(),
//                 destination.width.into(),
//                 destination.height.into(),
//             )
//             .expect("Drawing is throwing exceptions! Unrecoverable error");
//     }
// }

// #[async_trait(?Send)]
// pub trait Game {
//     async fn initialize(&self) -> Result<Box<dyn Game>>;
//     fn update(&mut self);
//     fn draw(&self, renderer: &Renderer);
// }

// const FRAME_SIZE: f32 = 1.0 / 60.0 * 1000.0;

// pub struct GameLoop {
//     last_frame: f64,
//     accumulated_delta: f32,
// }

// type SharedLoopClosure = Rc<RefCell<Option<browser::LoopClosure>>>;

// impl GameLoop {
//     pub async fn start(game: impl Game + 'static) -> Result<()> {
//         let mut game = game.initialize().await?;
//         let mut game_loop = GameLoop {
//             last_frame: browser::now()?,
//             accumulated_delta: 0.0,
//         };
//         let renderer = Renderer {
//             context: browser::context()?,
//         };
//         let f: SharedLoopClosure = Rc::new(RefCell::new(None));
//         let g = f.clone();
//         *g.borrow_mut() = Some(browser::create_raf_closure(move |perf: f64| {
//             game_loop.accumulated_delta += (perf - game_loop.last_frame) as f32;
//             while game_loop.accumulated_delta > FRAME_SIZE {
//                 game.update();
//                 game_loop.accumulated_delta -= FRAME_SIZE;
//             }
//             game_loop.last_frame = perf;
//             game.draw(&renderer);
//             browser::request_animation_frame(f.borrow().as_ref().unwrap());
//         }));
//         browser::request_animation_frame(
//             g.borrow()
//                 .as_ref()
//                 .ok_or_else(|| anyhow!("GameLoop: Loop is None"))?,
//         )?;
//         Ok(())
//     }
// }
