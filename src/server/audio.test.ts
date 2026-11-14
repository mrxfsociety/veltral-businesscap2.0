import { describe, expect, it } from "vitest";
import { validateAudio } from "./audio";

function join(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(
    parts.reduce((length, part) => length + part.length, 0),
  );
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}
const text = (value: string): Uint8Array<ArrayBuffer> =>
  new TextEncoder().encode(value);
const audioFile = (bytes: Uint8Array, type: string): File =>
  new File([new Uint8Array(bytes)], "recording", { type });

function wav(seconds: number, rate = 8000): Uint8Array<ArrayBuffer> {
  const dataSize = Math.round(seconds * rate) * 2;
  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);
  bytes.set(text("RIFF"), 0);
  view.setUint32(4, bytes.length - 8, true);
  bytes.set(text("WAVEfmt "), 8);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  bytes.set(text("data"), 36);
  view.setUint32(40, dataSize, true);
  return bytes;
}

function unsigned(value: number, width?: number): Uint8Array<ArrayBuffer> {
  const length = width ?? Math.max(1, Math.ceil(Math.log2(value + 1) / 8));
  const result = new Uint8Array(length);
  for (let index = length - 1; index >= 0; index -= 1) {
    result[index] = value % 256;
    value = Math.floor(value / 256);
  }
  return result;
}
function size(value: number): Uint8Array<ArrayBuffer> {
  let length = 1;
  while (value >= 2 ** (7 * length) - 1) length += 1;
  const result = unsigned(value, length);
  result[0] |= 1 << (8 - length);
  return result;
}
function ebml(
  id: number,
  data: Uint8Array,
  unknown = false,
): Uint8Array<ArrayBuffer> {
  return join(
    unsigned(id),
    unknown ? new Uint8Array([255]) : size(data.length),
    data,
  );
}
function double(value: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setFloat64(0, value);
  return bytes;
}
function opusBlock(
  timestamp: number,
  flags = 0,
  payload: Uint8Array = new Uint8Array([0xf8, 0xff, 0xfe]),
): Uint8Array<ArrayBuffer> {
  const header = new Uint8Array([0x81, 0, 0, flags]);
  new DataView(header.buffer).setInt16(1, timestamp);
  return ebml(0xa3, join(header, payload));
}

function webm(
  options: {
    frames?: number;
    timestampStep?: number;
    declaredDuration?: number;
    unknownCluster?: boolean;
    duplicateCluster?: boolean;
    packet?: Uint8Array;
    flags?: number;
  } = {},
): Uint8Array<ArrayBuffer> {
  const header = ebml(
    0x1a45dfa3,
    join(
      ebml(0x4286, unsigned(1)),
      ebml(0x42f7, unsigned(1)),
      ebml(0x4282, text("webm")),
      ebml(0x4287, unsigned(4)),
      ebml(0x4285, unsigned(2)),
    ),
  );
  const opusHead = join(
    text("OpusHead"),
    new Uint8Array([1, 1, 0, 0, 0x80, 0xbb, 0, 0, 0, 0, 0]),
  );
  const track = ebml(
    0xae,
    join(
      ebml(0xd7, unsigned(1)),
      ebml(0x73c5, unsigned(1)),
      ebml(0x83, unsigned(2)),
      ebml(0x86, text("A_OPUS")),
      ebml(0x63a2, opusHead),
      ebml(0xe1, join(ebml(0xb5, double(48000)), ebml(0x9f, unsigned(1)))),
    ),
  );
  const duration =
    options.declaredDuration === undefined
      ? new Uint8Array()
      : ebml(0x4489, double(options.declaredDuration));
  const info = ebml(
    0x1549a966,
    join(
      ebml(0x2ad7b1, unsigned(1_000_000)),
      duration,
      ebml(0x4d80, text("Do-Over test")),
      ebml(0x5741, text("Do-Over test")),
    ),
  );
  const blocks = Array.from({ length: options.frames ?? 50 }, (_, index) =>
    opusBlock(
      index * (options.timestampStep ?? 20),
      options.flags ?? 0,
      options.packet,
    ),
  );
  const cluster = ebml(
    0x1f43b675,
    join(ebml(0xe7, unsigned(0)), ...blocks),
    options.unknownCluster,
  );
  return join(
    header,
    ebml(
      0x18538067,
      join(
        info,
        ebml(0x1654ae6b, track),
        cluster,
        ...(options.duplicateCluster ? [cluster] : []),
      ),
      true,
    ),
  );
}

async function rejects(bytes: Uint8Array, type: string): Promise<void> {
  await expect(validateAudio(audioFile(bytes, type))).rejects.toMatchObject({
    status: 400,
    error: "validation",
  });
}

describe("bounded audio validation", () => {
  it("accepts real PCM samples up to exactly 12 seconds", async () => {
    await expect(
      validateAudio(audioFile(wav(0.25), "audio/wav")),
    ).resolves.toBeUndefined();
    await expect(
      validateAudio(audioFile(wav(12), "audio/x-wav")),
    ).resolves.toBeUndefined();
  });

  it("rejects PCM samples beyond 12 seconds", async () => {
    await rejects(wav(12.001), "audio/wav");
    await rejects(wav(13), "audio/wav");
  });

  it("does not trust forged WAV byte rate or truncated data lengths", async () => {
    const forged = wav(13);
    new DataView(forged.buffer).setUint32(28, 800_000, true);
    await rejects(forged, "audio/wav");
    await rejects(wav(1).subarray(0, 100), "audio/wav");
    const truncatedData = wav(1);
    new DataView(truncatedData.buffer).setUint32(
      40,
      truncatedData.length * 2,
      true,
    );
    await rejects(truncatedData, "audio/wav");
  });

  it("rejects empty, oversize, unsupported and MIME-disguised uploads", async () => {
    await rejects(new Uint8Array(), "audio/wav");
    await rejects(new Uint8Array(1_000_001), "audio/webm");
    await rejects(wav(1), "audio/ogg");
    await rejects(text("not an audio recording"), "audio/webm");
    await rejects(wav(1), "audio/webm");
    await rejects(webm(), "audio/wav");
  });

  it("reads MediaRecorder-style streaming WebM without a Duration element", async () => {
    await expect(
      validateAudio(audioFile(webm(), "audio/webm;codecs=opus")),
    ).resolves.toBeUndefined();
    await expect(
      validateAudio(audioFile(webm({ unknownCluster: true }), "audio/webm")),
    ).resolves.toBeUndefined();
    await expect(
      validateAudio(
        audioFile(
          webm({ unknownCluster: true, duplicateCluster: true }),
          "audio/webm",
        ),
      ),
    ).resolves.toBeUndefined();
  });

  it("counts WebM Opus packets even when duration metadata and timestamps are forged", async () => {
    await rejects(webm({ frames: 650, declaredDuration: 1 }), "audio/webm");
    await rejects(
      webm({ frames: 650, timestampStep: 0, declaredDuration: 1 }),
      "audio/webm",
    );
    await expect(
      validateAudio(audioFile(webm({ frames: 600 }), "audio/webm")),
    ).resolves.toBeUndefined();
  });

  it("includes timestamp gaps in duration", async () => {
    await rejects(webm({ frames: 2, timestampStep: 12_500 }), "audio/webm");
  });

  it("reads the supported WebM lacing modes", async () => {
    const packet = new Uint8Array([0xf8, 0xff, 0xfe]);
    for (const [flags, prefix] of [
      [4, [1]],
      [2, [1, 3]],
      [6, [1, 0x83]],
    ] as const) {
      const bytes = webm({
        frames: 1,
        flags,
        packet: join(new Uint8Array(prefix), packet, packet),
      });
      await expect(
        validateAudio(audioFile(bytes, "audio/webm")),
      ).resolves.toBeUndefined();
    }
    await rejects(
      webm({ frames: 1, flags: 4, packet: new Uint8Array([2, 0xf8]) }),
      "audio/webm",
    );
  });

  it("rejects malformed Opus packets and truncated EBML", async () => {
    await rejects(webm({ packet: new Uint8Array() }), "audio/webm");
    await rejects(webm({ packet: new Uint8Array([0xfb, 0x3f]) }), "audio/webm");
    const bytes = webm();
    await rejects(bytes.subarray(0, bytes.length - 1), "audio/webm");
    await rejects(new Uint8Array([0, 255, 255]), "audio/webm");
  });
});

/** Structural AAC-LC MP4 fixtures for duration-parser unit tests. */
function mp4Fixture(
  options: {
    fragmented?: boolean;
    count?: number;
    sampleDuration?: number;
    lastSampleDuration?: number;
    sampleRate?: 44100 | 48000;
    timescale?: number;
    initialTime?: number;
    editRate?: number;
    editDurationMs?: number;
    editMediaTime?: number;
    editVersion?: 0 | 1;
  } = {},
): Uint8Array {
  const {
    fragmented = false,
    count = 48,
    sampleDuration = 1024,
    sampleRate = 48000,
    timescale = 48000,
    initialTime = 0,
  } = options;
  const join = (...parts: Uint8Array[]): Uint8Array => {
    const result = new Uint8Array(
      parts.reduce((sum, part) => sum + part.length, 0),
    );
    let offset = 0;
    for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
    }
    return result;
  };
  const text = (value: string): Uint8Array => new TextEncoder().encode(value);
  const uint = (...values: number[]): Uint8Array => {
    const result = new Uint8Array(values.length * 4);
    const view = new DataView(result.buffer);
    values.forEach((value, index) => view.setUint32(index * 4, value));
    return result;
  };
  const box = (type: string, ...parts: Uint8Array[]): Uint8Array => {
    const data = join(...parts);
    return join(uint(data.length + 8), text(type), data);
  };
  const descriptor = (tag: number, data: Uint8Array): Uint8Array =>
    join(new Uint8Array([tag, data.length]), data);
  const sampleHeader = new Uint8Array(28);
  const sampleView = new DataView(sampleHeader.buffer);
  sampleView.setUint16(6, 1);
  sampleView.setUint16(16, 1);
  sampleView.setUint16(18, 16);
  sampleView.setUint32(24, sampleRate * 65536);
  const config = descriptor(
    5,
    new Uint8Array(sampleRate === 44100 ? [0x12, 0x08] : [0x11, 0x88]),
  );
  const decoder = descriptor(
    4,
    join(new Uint8Array([0x40, 0x15, 0, 0, 0]), uint(16000, 16000), config),
  );
  const es = descriptor(
    3,
    join(
      new Uint8Array([0, 1, 0]),
      decoder,
      descriptor(6, new Uint8Array([2])),
    ),
  );
  const sampleEntry = box("mp4a", sampleHeader, box("esds", uint(0), es));
  const ftyp = box("ftyp", text("isom"), uint(0), text("isommp42"));
  const sampleCount = fragmented ? 0 : count;
  const stts = sampleCount
    ? options.lastSampleDuration === undefined
      ? box("stts", uint(0, 1, count, sampleDuration))
      : box(
          "stts",
          uint(0, 2, count - 1, sampleDuration, 1, options.lastSampleDuration),
        )
    : box("stts", uint(0, 0));
  const stsc = sampleCount
    ? box("stsc", uint(0, 1, 1, count, 1))
    : box("stsc", uint(0, 0));
  const stco = sampleCount
    ? box("stco", uint(0, 1, ftyp.length + 8))
    : box("stco", uint(0, 0));
  const stbl = box(
    "stbl",
    box("stsd", uint(0, 1), sampleEntry),
    stts,
    stsc,
    box("stsz", uint(0, 2, sampleCount)),
    stco,
  );
  const minf = box(
    "minf",
    box("smhd", uint(0, 0)),
    box("dinf", box("dref", uint(0, 1), box("url ", uint(1)))),
    stbl,
  );
  const mdhd = box("mdhd", uint(0, 0, 0, timescale, 1, 0));
  const hdlr = box(
    "hdlr",
    uint(0, 0),
    text("soun"),
    new Uint8Array(12),
    text("Audio\0"),
  );
  const tkhdBody = new Uint8Array(84);
  new DataView(tkhdBody.buffer).setUint32(12, 1);
  const mvhdBody = new Uint8Array(100);
  new DataView(mvhdBody.buffer).setUint32(12, 1000);
  let edits: Uint8Array = new Uint8Array();
  if (
    options.editRate !== undefined ||
    options.editDurationMs !== undefined ||
    options.editMediaTime !== undefined
  ) {
    const rate = options.editRate ?? 1;
    const fixedRate = Math.round(rate * 65536);
    const version = options.editVersion ?? 0;
    const duration =
      options.editDurationMs ??
      Math.ceil(((count * sampleDuration) / timescale) * 1000);
    const mediaTime = options.editMediaTime ?? 0;
    edits = box(
      "edts",
      box(
        "elst",
        uint(version << 24, 1),
        version === 0
          ? uint(duration, mediaTime, fixedRate)
          : uint(
              0,
              duration,
              mediaTime < 0 ? 0xffffffff : 0,
              mediaTime,
              fixedRate,
            ),
      ),
    );
  }
  const trak = box(
    "trak",
    box("tkhd", tkhdBody),
    edits,
    box("mdia", mdhd, hdlr, minf),
  );
  const mvex = fragmented
    ? box("mvex", box("trex", uint(0, 1, 1, sampleDuration, 2, 0)))
    : new Uint8Array();
  const moov = box("moov", box("mvhd", mvhdBody), trak, mvex);
  const audio = new Uint8Array(count * 2).fill(0x21);
  const mdat = box("mdat", audio);
  if (!fragmented) return join(ftyp, mdat, moov);
  const fragment = (offset: number): Uint8Array =>
    box(
      "moof",
      box("mfhd", uint(0, 1)),
      box(
        "traf",
        box("tfhd", uint(0x020000, 1)),
        box("tfdt", uint(0, initialTime)),
        box("trun", uint(1, count, offset)),
      ),
    );
  const moof = fragment(fragment(0).length + 8);
  return join(ftyp, moov, moof, mdat);
}

describe("MP4 audio duration validation", () => {
  it("accepts regular and fragmented AAC-LC recordings", async () => {
    for (const fragmented of [false, true]) {
      await expect(
        validateAudio(audioFile(mp4Fixture({ fragmented }), "audio/mp4")),
      ).resolves.toBeUndefined();
    }
  });

  it("accepts exactly 12 seconds after bounded AAC priming and final padding", async () => {
    for (const editVersion of [0, 1] as const) {
      // FFmpeg's 44.1 kHz AAC output: 1024 priming samples, with the last
      // packet's sample-table duration shortened to the source endpoint.
      await expect(
        validateAudio(
          audioFile(
            mp4Fixture({
              sampleRate: 44100,
              timescale: 44100,
              count: 518,
              lastSampleDuration: 816,
              editDurationMs: 12_000,
              editMediaTime: 1024,
              editVersion,
            }),
            "audio/mp4",
          ),
        ),
      ).resolves.toBeUndefined();
      // Apple's common 2112-sample lead-in and 448 trailing padded samples.
      await expect(
        validateAudio(
          audioFile(
            mp4Fixture({
              count: 565,
              editDurationMs: 12_000,
              editMediaTime: 2112,
              editVersion,
            }),
            "audio/mp4",
          ),
        ),
      ).resolves.toBeUndefined();
    }
  });

  it("does not let edit headers or forged sample timing hide excess AAC audio", async () => {
    for (const editVersion of [0, 1] as const) {
      for (const options of [
        { count: 610, editMediaTime: 1024 },
        { count: 610, editMediaTime: 48_000 },
        { count: 610, editMediaTime: -1 },
        { count: 566, editMediaTime: 2112 },
        { count: 565, editMediaTime: 2112, sampleDuration: 1 },
        { count: 565, editMediaTime: 2112, timescale: 1_000_000 },
        { count: 610, editMediaTime: 1024, sampleDuration: 1 },
        { count: 610, editMediaTime: 1024, timescale: 1_000_000 },
      ]) {
        await rejects(
          mp4Fixture({
            ...options,
            editDurationMs: 12_000,
            editVersion,
          }),
          "audio/mp4",
        );
      }
    }
    await rejects(
      mp4Fixture({
        sampleRate: 44100,
        timescale: 44100,
        count: 519,
        lastSampleDuration: 233,
        editDurationMs: 12_010,
        editMediaTime: 1024,
      }),
      "audio/mp4",
    );
  });

  it("rejects actual AAC sample counts above 12 seconds despite forged timing metadata", async () => {
    for (const fragmented of [false, true]) {
      await rejects(mp4Fixture({ fragmented, count: 610 }), "audio/mp4");
      await rejects(
        mp4Fixture({
          fragmented,
          count: 610,
          sampleDuration: 1,
          timescale: 1_000_000,
        }),
        "audio/mp4",
      );
    }
  });

  it("counts edit-list and fragment timeline gaps and rejects speed changes", async () => {
    await rejects(mp4Fixture({ editRate: 0.5 }), "audio/mp4");
    await rejects(mp4Fixture({ editDurationMs: 14_000 }), "audio/mp4");
    await rejects(
      mp4Fixture({ fragmented: true, initialTime: 600_000 }),
      "audio/mp4",
    );
  });

  it("rejects missing media, unknown codecs and out-of-bounds sample offsets", async () => {
    const malformed = mp4Fixture();
    const offset = new TextDecoder("ascii").decode(malformed).indexOf("stco");
    new DataView(
      malformed.buffer,
      malformed.byteOffset,
      malformed.byteLength,
    ).setUint32(offset + 12, malformed.length + 100);
    await rejects(malformed, "audio/mp4");
    await rejects(mp4Fixture().subarray(0, 64), "audio/mp4");
    const wrongCodec = mp4Fixture();
    const codecOffset = new TextDecoder("ascii")
      .decode(wrongCodec)
      .indexOf("mp4a");
    wrongCodec.set(text("alac"), codecOffset);
    await rejects(wrongCodec, "audio/mp4");
  });
});
