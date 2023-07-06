function draw_triangle(
  context: CanvasRenderingContext2D,
  points: [[number, number], [number, number], [number, number]],
  color: [number, number, number]
) {
  let color_str = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  context.fillStyle = color_str;
  let [top, left, right] = points;
  context.moveTo(top[0], top[1]);
  context.beginPath();
  context.lineTo(left[0], left[1]);
  context.lineTo(right[0], right[1]);
  context.lineTo(top[0], top[1]);
  context.closePath();
  context.stroke();
  context.fill();
}

function midpoint(
  point_1: [number, number],
  point_2: [number, number]
): [number, number] {
  return [(point_1[0] + point_2[0]) / 2.0, (point_1[1] + point_2[1]) / 2.0];
}

export function sierpinski(
  context: CanvasRenderingContext2D,
  points: [[number, number], [number, number], [number, number]],
  color: [number, number, number],
  depth: number
) {
  let next_color: [number, number, number] = [
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
  ];

  draw_triangle(context, points, color);
  depth = depth - 1;
  let [top, left, right] = points;
  if (depth > 0) {
    let left_middle = midpoint(top, left);
    let right_middle = midpoint(top, right);
    let bottom_middle = midpoint(left, right);
    sierpinski(context, [top, left_middle, right_middle], next_color, depth);
    sierpinski(context, [left_middle, left, bottom_middle], next_color, depth);
    sierpinski(
      context,
      [right_middle, bottom_middle, right],
      next_color,
      depth
    );
  }
}
1