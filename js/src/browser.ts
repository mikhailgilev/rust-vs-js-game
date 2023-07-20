export function canvas(): HTMLCanvasElement {
  return <HTMLCanvasElement>document.getElementById("canvas");
}

export function context(): CanvasRenderingContext2D {
  let context = canvas().getContext("2d");
  if (context) {
    return context;
  }
  throw new Error("Error getting 2d context");
}

export async function fetch_with_str(resource: string): Promise<Response> {
  return await fetch(resource);
}

export async function fetch_json(json_path: string): Promise<any> {
  let resp_value = fetch_with_str(json_path);

  return (await resp_value).json();
}

export function new_image(): HTMLImageElement {
  return document.createElement("img");
}

export function request_animation_frame(callback: (perf: number) => void): number {
  return requestAnimationFrame(callback);
}

export function now(): number {
  return performance.now();
}
