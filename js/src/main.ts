import { GameLoop } from "./engine";
import { WalkTheDog } from "./game";

function main() {
  let game = new WalkTheDog();
  let gameLoop = new GameLoop();
  gameLoop.start(game);
}

main();
