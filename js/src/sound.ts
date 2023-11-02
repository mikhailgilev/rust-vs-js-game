export function create_audio_context(): AudioContext {
  return new AudioContext();
}

function create_buffer_source(ctx: AudioContext): AudioBufferSourceNode {
  return ctx.createBufferSource();
}

function connect_with_audio_node(buffer_source: AudioBufferSourceNode, destination: AudioDestinationNode): AudioNode {
  return buffer_source.connect(destination);
}

function create_track_source(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const track_source = create_buffer_source(ctx);
  track_source.buffer = buffer;
  connect_with_audio_node(track_source, ctx.destination);
  return track_source;
}

export enum LOOPING {
  NO,
  YES,
}

export function play_sound(ctx: AudioContext, buffer: AudioBuffer, looping: LOOPING): void {
  const track_source = create_track_source(ctx, buffer);
  if (looping === LOOPING.YES) {
    track_source.loop = true;
  }
  track_source.start();
}

export async function decode_audio_data(ctx: AudioContext, array_buffer: ArrayBuffer): Promise<AudioBuffer> {
  return ctx.decodeAudioData(array_buffer);
}
