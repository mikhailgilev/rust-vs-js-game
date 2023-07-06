import { sierpinski } from "./draw";

function main() {
  const canvas = <HTMLCanvasElement>document.getElementById("canvas");
  const context = canvas.getContext("2d");
  sierpinski(
    context!,
    [
      [300, 0],
      [0, 600],
      [600, 600],
    ],
    [0, 255, 0],
    5
  );
}

main();
