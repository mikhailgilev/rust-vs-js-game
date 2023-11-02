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

export async function fetch_array_buffer(
  resource: string
): Promise<ArrayBuffer> {
  let array_buffer = await fetch(resource);
  return array_buffer.arrayBuffer();
}

export function new_image(): HTMLImageElement {
  return document.createElement("img");
}

export function request_animation_frame(
  callback: (perf: number) => void
): number {
  return requestAnimationFrame(callback);
}

export function now(): number {
  return performance.now();
}

function find_ui(): HTMLElement {
  const el = document.getElementById("ui");
  if (!el) {
    throw new Error("Could not find element with id 'ui'");
  }
  return el;
}

function draw_ui(html: string): void {
  find_ui().insertAdjacentHTML("afterbegin", html);
}

function hide_ui(): void {
  const ui = find_ui();
  const child = ui.firstChild;
  if (child) {
    ui.removeChild(child);
    canvas().focus();
  }
}

function find_html_element_by_id(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Could not find element with id '${id}'`);
  }
  return el;
}
