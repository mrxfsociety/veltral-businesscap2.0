import { ApiError } from "./http";

const MAX_AUDIO_BYTES = 1_000_000;
const MAX_AUDIO_SECONDS = 12;
const MAX_ELEMENTS = 10_000;

function invalidAudio(): never {
  throw new Error("Invalid or unsupported audio container.");
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return new TextDecoder("ascii").decode(bytes.subarray(start, end));
}

/** PCM duration comes from the actual data, not RIFF's optional duration tags. */
function durationWav(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    bytes.length < 44 ||
    ascii(bytes, 0, 4) !== "RIFF" ||
    ascii(bytes, 8, 12) !== "WAVE"
  )
    invalidAudio();
  if (view.getUint32(4, true) + 8 !== bytes.length) invalidAudio();
  let cursor = 12;
  let sampleRate = 0;
  let blockAlign = 0;
  let dataBytes = 0;
  let dataChunks = 0;
  let elements = 0;
  while (cursor < bytes.length) {
    if (++elements > MAX_ELEMENTS || cursor + 8 > bytes.length) invalidAudio();
    const kind = ascii(bytes, cursor, cursor + 4);
    const length = view.getUint32(cursor + 4, true);
    const start = cursor + 8;
    const end = start + length;
    if (end > bytes.length) invalidAudio();
    if (kind === "fmt ") {
      if (sampleRate !== 0 || length < 16) invalidAudio();
      const format = view.getUint16(start, true);
      const channels = view.getUint16(start + 2, true);
      sampleRate = view.getUint32(start + 4, true);
      const byteRate = view.getUint32(start + 8, true);
      blockAlign = view.getUint16(start + 12, true);
      const bits = view.getUint16(start + 14, true);
      if (
        (format !== 1 && format !== 3) ||
        channels < 1 ||
        channels > 2 ||
        sampleRate < 8_000 ||
        sampleRate > 192_000
      )
        invalidAudio();
      if (!(format === 1 ? [8, 16, 24, 32] : [32, 64]).includes(bits))
        invalidAudio();
      if (
        blockAlign !== (channels * bits) / 8 ||
        byteRate !== sampleRate * blockAlign
      )
        invalidAudio();
    } else if (kind === "data") {
      dataBytes += length;
      dataChunks += 1;
    }
    cursor = end + (length % 2);
    if (cursor > bytes.length) invalidAudio();
  }
  if (
    !sampleRate ||
    dataChunks !== 1 ||
    !dataBytes ||
    dataBytes % blockAlign !== 0
  )
    invalidAudio();
  return dataBytes / blockAlign / sampleRate;
}

interface Vint {
  value: number;
  next: number;
  length: number;
  unknown: boolean;
}
interface EbmlElement {
  id: number;
  start: number;
  end: number;
  unknown: boolean;
}

function vint(
  bytes: Uint8Array,
  offset: number,
  end: number,
  identifier = false,
): Vint {
  if (offset >= end || bytes[offset] === 0) invalidAudio();
  let mask = 0x80;
  let length = 1;
  while (!(bytes[offset] & mask)) {
    mask >>= 1;
    length += 1;
  }
  if (length > (identifier ? 4 : 8) || offset + length > end) invalidAudio();
  let value = identifier ? bytes[offset] : bytes[offset] & (mask - 1);
  let unknown = !identifier && value === mask - 1;
  for (let index = 1; index < length; index += 1) {
    value = value * 256 + bytes[offset + index];
    unknown = unknown && bytes[offset + index] === 255;
  }
  if (!unknown && !Number.isSafeInteger(value)) invalidAudio();
  return { value, next: offset + length, length, unknown };
}

/** Opus packet framing and timing follow RFC 6716 section 3, without decoding audio. */
function opusSeconds(packet: Uint8Array): number {
  if (!packet.length) invalidAudio();
  const config = packet[0] >> 3;
  const frameMs =
    config >= 16
      ? 2.5 * 2 ** (config & 3)
      : config >= 12
        ? 10 * 2 ** (config & 1)
        : [10, 20, 40, 60][config & 3];
  const code = packet[0] & 3;
  let frames = code === 0 ? 1 : 2;
  let cursor = 1;
  let end = packet.length;
  const frameLength = (): number => {
    if (cursor >= end) invalidAudio();
    const first = packet[cursor++];
    if (first < 252) return first;
    if (cursor >= end) invalidAudio();
    return first + 4 * packet[cursor++];
  };
  const validLength = (length: number): void => {
    if (length < 0 || length > 1275) invalidAudio();
  };
  if (code === 0) validLength(end - cursor);
  if (code === 1) {
    if ((end - cursor) % 2 !== 0) invalidAudio();
    validLength((end - cursor) / 2);
  }
  if (code === 2) {
    const first = frameLength();
    validLength(first);
    validLength(end - cursor - first);
  }
  if (code === 3) {
    if (cursor >= end) invalidAudio();
    const control = packet[cursor++];
    frames = control & 0x3f;
    if (!frames || frames * frameMs > 120) invalidAudio();
    if (control & 0x40) {
      let padding = 0;
      let value: number;
      do {
        if (cursor >= end) invalidAudio();
        value = packet[cursor++];
        padding += value === 255 ? 254 : value;
      } while (value === 255);
      end -= padding;
      if (end < cursor) invalidAudio();
    }
    if (control & 0x80) {
      let used = 0;
      for (let index = 0; index < frames - 1; index += 1) {
        const length = frameLength();
        validLength(length);
        used += length;
      }
      validLength(end - cursor - used);
    } else {
      if ((end - cursor) % frames !== 0) invalidAudio();
      validLength((end - cursor) / frames);
    }
  }
  if (frames * frameMs > 120) invalidAudio();
  return (frames * frameMs) / 1000;
}

function blockFrames(
  bytes: Uint8Array,
  start: number,
  end: number,
  flags: number,
): Uint8Array[] {
  const lacing = (flags >> 1) & 3;
  if (!lacing) return [bytes.subarray(start, end)];
  if (start >= end) invalidAudio();
  const count = bytes[start++] + 1;
  if (count < 2) invalidAudio();
  const sizes: number[] = [];
  if (lacing === 2) {
    if ((end - start) % count !== 0) invalidAudio();
    for (let index = 0; index < count - 1; index += 1)
      sizes.push((end - start) / count);
  } else {
    for (let index = 0; index < count - 1; index += 1) {
      let size = 0;
      if (lacing === 1) {
        let part: number;
        do {
          if (start >= end) invalidAudio();
          part = bytes[start++];
          size += part;
        } while (part === 255);
      } else {
        const encoded = vint(bytes, start, end);
        if (encoded.unknown) invalidAudio();
        start = encoded.next;
        size =
          index === 0
            ? encoded.value
            : sizes[index - 1] +
              encoded.value -
              (2 ** (7 * encoded.length - 1) - 1);
      }
      if (!Number.isSafeInteger(size) || size < 1 || size > end - start)
        invalidAudio();
      sizes.push(size);
    }
  }
  sizes.push(end - start - sizes.reduce((total, size) => total + size, 0));
  return sizes.map((size) => {
    if (size < 1 || start + size > end) invalidAudio();
    const frame = bytes.subarray(start, start + size);
    start += size;
    return frame;
  });
}

/** Streaming WebM frequently has no Duration. Count actual Opus packets and timestamp spans. */
function durationWebm(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let elements = 0;
  const element = (cursor: number, end: number): EbmlElement => {
    if (++elements > MAX_ELEMENTS) invalidAudio();
    const id = vint(bytes, cursor, end, true);
    const size = vint(bytes, id.next, end);
    const finish = size.unknown ? end : size.next + size.value;
    if (finish > end) invalidAudio();
    return {
      id: id.value,
      start: size.next,
      end: finish,
      unknown: size.unknown,
    };
  };
  const children = (parent: EbmlElement): EbmlElement[] => {
    if (parent.unknown) invalidAudio();
    const result: EbmlElement[] = [];
    for (let cursor = parent.start; cursor < parent.end;) {
      const child = element(cursor, parent.end);
      if (child.unknown) invalidAudio();
      result.push(child);
      cursor = child.end;
    }
    return result;
  };
  const integer = (field: EbmlElement): number => {
    if (field.end - field.start < 1 || field.end - field.start > 8)
      invalidAudio();
    let value = 0;
    for (let cursor = field.start; cursor < field.end; cursor += 1)
      value = value * 256 + bytes[cursor];
    if (!Number.isSafeInteger(value)) invalidAudio();
    return value;
  };
  const float = (field: EbmlElement): number => {
    const length = field.end - field.start;
    if (length !== 4 && length !== 8) invalidAudio();
    const value =
      length === 4
        ? view.getFloat32(field.start)
        : view.getFloat64(field.start);
    if (!Number.isFinite(value)) invalidAudio();
    return value;
  };
  const header = element(0, bytes.length);
  if (header.id !== 0x1a45dfa3 || header.unknown) invalidAudio();
  const docType = children(header).find((child) => child.id === 0x4282);
  if (!docType || ascii(bytes, docType.start, docType.end) !== "webm")
    invalidAudio();
  const segment = element(header.end, bytes.length);
  if (segment.id !== 0x18538067 || segment.end !== bytes.length) invalidAudio();
  let timestampScale = 1_000_000;
  let declaredSeconds = 0;
  let trackNumber = 0;
  let trackSeen = false;
  let infoSeen = false;
  const clusters: EbmlElement[] = [];
  const topLevel = new Set([
    0x114d9b74, 0x1549a966, 0x1654ae6b, 0x1f43b675, 0x1c53bb6b, 0x1254c367,
    0x1941a469, 0x1043a770,
  ]);
  for (let cursor = segment.start; cursor < segment.end;) {
    const current = element(cursor, segment.end);
    if (current.unknown && current.id !== 0x1f43b675) invalidAudio();
    if (current.id === 0x1549a966) {
      if (infoSeen) invalidAudio();
      infoSeen = true;
      const fields = children(current);
      const scale = fields.filter((field) => field.id === 0x2ad7b1);
      if (scale.length > 1) invalidAudio();
      if (scale[0]) timestampScale = integer(scale[0]);
      if (timestampScale < 1 || timestampScale > 1_000_000_000) invalidAudio();
      const durations = fields.filter((field) => field.id === 0x4489);
      if (durations.length > 1) invalidAudio();
      if (durations[0]) {
        declaredSeconds =
          (float(durations[0]) * timestampScale) / 1_000_000_000;
        if (declaredSeconds < 0 || !Number.isFinite(declaredSeconds))
          invalidAudio();
      }
    }
    if (current.id === 0x1654ae6b) {
      if (trackSeen) invalidAudio();
      trackSeen = true;
      const entries = children(current).filter((child) => child.id === 0xae);
      if (entries.length !== 1) invalidAudio();
      const fields = children(entries[0]);
      const get = (id: number): EbmlElement => {
        const found = fields.filter((field) => field.id === id);
        if (found.length !== 1) invalidAudio();
        return found[0];
      };
      trackNumber = integer(get(0xd7));
      if (!trackNumber || integer(get(0x83)) !== 2) invalidAudio();
      const codec = get(0x86);
      if (
        ascii(bytes, codec.start, codec.end) !== "A_OPUS" ||
        fields.some((field) => field.id === 0x6d80)
      )
        invalidAudio();
      const privateData = get(0x63a2);
      if (
        privateData.end - privateData.start !== 19 ||
        ascii(bytes, privateData.start, privateData.start + 8) !== "OpusHead"
      )
        invalidAudio();
      if (
        bytes[privateData.start + 8] > 15 ||
        ![1, 2].includes(bytes[privateData.start + 9]) ||
        bytes[privateData.start + 18] !== 0
      )
        invalidAudio();
      const scale = fields.find((field) => field.id === 0x23314f);
      if (scale && float(scale) !== 1) invalidAudio();
    }
    if (current.id === 0x1f43b675) {
      if (current.unknown) {
        let finish = current.start;
        while (finish < current.end) {
          const child = element(finish, current.end);
          if (topLevel.has(child.id)) break;
          if (child.unknown) invalidAudio();
          finish = child.end;
        }
        clusters.push({ ...current, end: finish, unknown: false });
        cursor = finish;
        continue;
      }
      clusters.push(current);
    }
    cursor = current.end;
  }
  if (!trackSeen || !infoSeen || !clusters.length) invalidAudio();
  let packetSeconds = 0;
  let earliest = 0;
  let latest = 0;
  let blocks = 0;
  const block = (
    field: EbmlElement,
    clusterTime: number,
    declaredDuration = 0,
  ): void => {
    const track = vint(bytes, field.start, field.end);
    if (
      track.unknown ||
      track.value !== trackNumber ||
      track.next + 3 >= field.end
    )
      invalidAudio();
    const time =
      ((clusterTime + view.getInt16(track.next)) * timestampScale) /
      1_000_000_000;
    if (!Number.isFinite(time) || time < -0.12) invalidAudio();
    const frames = blockFrames(
      bytes,
      track.next + 3,
      field.end,
      bytes[track.next + 2],
    );
    const duration = frames.reduce(
      (total, frame) => total + opusSeconds(frame),
      0,
    );
    packetSeconds += duration;
    earliest = Math.min(earliest, time);
    latest = Math.max(latest, time + Math.max(duration, declaredDuration));
    blocks += 1;
  };
  for (const cluster of clusters) {
    const fields = children(cluster);
    const timestamps = fields.filter((field) => field.id === 0xe7);
    if (timestamps.length !== 1) invalidAudio();
    const clusterTime = integer(timestamps[0]);
    for (const field of fields) {
      if (field.id === 0xa3) block(field, clusterTime);
      if (field.id === 0xa0) {
        const group = children(field);
        const encodedBlocks = group.filter((entry) => entry.id === 0xa1);
        if (encodedBlocks.length !== 1) invalidAudio();
        const durations = group.filter((entry) => entry.id === 0x9b);
        if (durations.length > 1) invalidAudio();
        const duration = durations[0]
          ? (integer(durations[0]) * timestampScale) / 1_000_000_000
          : 0;
        block(encodedBlocks[0], clusterTime, duration);
      }
    }
  }
  if (!blocks) invalidAudio();
  return Math.max(packetSeconds, latest - earliest, declaredSeconds);
}

/** Bounded AAC-LC MP4 sample-table reader; container duration fields are not trusted. */
function durationMp4(bytes: Uint8Array): number {
  type Box = { type: string; start: number; data: number; end: number };
  type Range = { start: number; end: number };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const fail = (): never => {
    throw new Error("Unsupported or malformed MP4 audio.");
  };
  if (bytes.byteLength < 24 || bytes.byteLength > 1_000_000) fail();
  let operations = 0;
  const budget = (): void => {
    if (++operations > 30_000) fail();
  };
  const check = (offset: number, length: number, end = bytes.length): void => {
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      length < 0 ||
      offset + length > end ||
      end > bytes.length
    )
      fail();
  };
  const u16 = (offset: number, end = bytes.length): number => {
    check(offset, 2, end);
    return view.getUint16(offset);
  };
  const u32 = (offset: number, end = bytes.length): number => {
    check(offset, 4, end);
    return view.getUint32(offset);
  };
  const i32 = (offset: number, end = bytes.length): number => {
    check(offset, 4, end);
    return view.getInt32(offset);
  };
  const u64 = (offset: number, end = bytes.length): number => {
    check(offset, 8, end);
    const value = Number(view.getBigUint64(offset));
    if (!Number.isSafeInteger(value)) fail();
    return value;
  };
  const ascii = (
    offset: number,
    length: number,
    end = bytes.length,
  ): string => {
    check(offset, length, end);
    return String.fromCharCode(...bytes.subarray(offset, offset + length));
  };
  const boxes = (start: number, end: number): Box[] => {
    const result: Box[] = [];
    for (let offset = start; offset < end;) {
      budget();
      check(offset, 8, end);
      let size = u32(offset, end);
      const type = ascii(offset + 4, 4, end);
      let header = 8;
      if (size === 1) {
        size = u64(offset + 8, end);
        header = 16;
      } else if (size === 0) size = end - offset;
      if (size < header || size > end - offset) fail();
      result.push({
        type,
        start: offset,
        data: offset + header,
        end: offset + size,
      });
      offset += size;
    }
    return result;
  };
  const one = (list: Box[], type: string, required = true): Box | undefined => {
    const matches = list.filter((box) => box.type === type);
    if (matches.length > 1 || (required && matches.length !== 1)) fail();
    return matches[0];
  };
  const required = (list: Box[], type: string): Box => {
    const found = one(list, type);
    if (!found) return fail();
    return found;
  };
  const children = (box: Box): Box[] => boxes(box.data, box.end);
  const fullVersion = (box: Box, allowed = [0]): number => {
    check(box.data, 4, box.end);
    const version = bytes[box.data];
    if (!allowed.includes(version)) fail();
    return version;
  };
  const countAt = (box: Box, offset: number, entrySize: number): number => {
    const count = u32(offset, box.end);
    if (count > 10_000 || offset + 4 + count * entrySize !== box.end) fail();
    return count;
  };
  const top = boxes(0, bytes.length);
  const ftyp = required(top, "ftyp");
  if (ftyp.end - ftyp.data < 8) fail();
  const moov = required(top, "moov");
  const movie = children(moov);
  const track = required(movie, "trak");
  const trackChildren = children(track);
  const tkhd = required(trackChildren, "tkhd");
  const trackVersion = fullVersion(tkhd, [0, 1]);
  const trackId = u32(tkhd.data + (trackVersion === 0 ? 12 : 20), tkhd.end);
  if (!trackId) fail();
  const media = children(required(trackChildren, "mdia"));
  const handler = required(media, "hdlr");
  fullVersion(handler);
  if (ascii(handler.data + 8, 4, handler.end) !== "soun") fail();
  const mdhd = required(media, "mdhd");
  const mediaVersion = fullVersion(mdhd, [0, 1]);
  const timescale = u32(mdhd.data + (mediaVersion === 0 ? 12 : 20), mdhd.end);
  if (!timescale) fail();
  const minf = children(required(media, "minf"));
  const dinf = children(required(minf, "dinf"));
  const dref = required(dinf, "dref");
  fullVersion(dref);
  if (u32(dref.data + 4, dref.end) !== 1) fail();
  const references = boxes(dref.data + 8, dref.end);
  if (references.length !== 1) fail();
  const url = required(references, "url ");
  if (u32(url.data, url.end) !== 1) fail();
  const table = children(required(minf, "stbl"));
  const stsd = required(table, "stsd");
  fullVersion(stsd);
  if (u32(stsd.data + 4, stsd.end) !== 1) fail();
  const descriptions = boxes(stsd.data + 8, stsd.end);
  if (descriptions.length !== 1) fail();
  const entry = required(descriptions, "mp4a");
  check(entry.data, 28, entry.end);
  if (u16(entry.data + 6, entry.end) !== 1) fail();
  const soundVersion = u16(entry.data + 8, entry.end);
  if (soundVersion !== 0 && soundVersion !== 1) fail();
  const channels = u16(entry.data + 16, entry.end);
  if (channels < 1 || channels > 2) fail();
  const declaredRate = u32(entry.data + 24, entry.end) / 65536;
  const codecChildren = boxes(
    entry.data + (soundVersion === 1 ? 44 : 28),
    entry.end,
  );
  if (codecChildren.some((box) => box.type === "sinf")) fail();
  const esds = required(codecChildren, "esds");
  fullVersion(esds);
  let asc: Uint8Array | undefined;
  const descriptors = (start: number, end: number, depth: number): void => {
    if (depth > 3) fail();
    for (let position = start; position < end;) {
      budget();
      check(position, 2, end);
      const tag = bytes[position++];
      let length = 0;
      let ended = false;
      for (let index = 0; index < 4; index += 1) {
        check(position, 1, end);
        const part = bytes[position++];
        length = length * 128 + (part & 127);
        if (!(part & 128)) {
          ended = true;
          break;
        }
      }
      if (!ended || length > end - position) fail();
      const finish = position + length;
      if (tag === 3) {
        check(position, 3, finish);
        const flags = bytes[position + 2];
        let nested = position + 3;
        if (flags & 128) nested += 2;
        if (flags & 64) {
          check(nested, 1, finish);
          nested += bytes[nested] + 1;
        }
        if (flags & 32) nested += 2;
        check(nested, 0, finish);
        descriptors(nested, finish, depth + 1);
      } else if (tag === 4) {
        check(position, 13, finish);
        if (bytes[position] !== 0x40 || ((bytes[position + 1] >> 2) & 63) !== 5)
          fail();
        descriptors(position + 13, finish, depth + 1);
      } else if (tag === 5) {
        if (asc || length < 2 || length > 64) fail();
        asc = bytes.subarray(position, finish);
      }
      position = finish;
    }
  };
  descriptors(esds.data + 4, esds.end, 0);
  const config: Uint8Array = asc ?? fail();
  let bit = 0;
  const bits = (length: number): number => {
    if (bit + length > config.length * 8) fail();
    let value = 0;
    for (let index = 0; index < length; index += 1, bit += 1)
      value = value * 2 + ((config[bit >> 3] >> (7 - (bit & 7))) & 1);
    return value;
  };
  if (bits(5) !== 2) fail();
  const frequencyIndex = bits(4);
  const rates = [
    96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025,
    8000, 7350,
  ];
  const sampleRate = frequencyIndex === 15 ? bits(24) : rates[frequencyIndex];
  if (
    !sampleRate ||
    sampleRate < 8000 ||
    sampleRate > 96000 ||
    sampleRate !== declaredRate
  )
    fail();
  if (bits(4) !== channels) fail();
  const frameSamples = bits(1) ? 960 : 1024;
  if (bits(1) !== 0 || bits(1) !== 0) fail();
  if (config.length * 8 - bit >= 16 && bits(11) === 0x2b7) {
    if (bits(5) !== 5 || (config.length * 8 > bit && bits(1) !== 0)) fail();
  }
  const mediaRanges = top
    .filter((box) => box.type === "mdat")
    .map((box) => ({ start: box.data, end: box.end }));
  if (!mediaRanges.length) fail();
  const used: Range[] = [];
  let sampleCount = 0;
  let totalTicks = 0;
  let firstTick = Infinity;
  let lastTick = -Infinity;
  const addSample = (
    offset: number,
    size: number,
    duration: number,
    time: number,
  ): void => {
    budget();
    if (
      !size ||
      !duration ||
      !Number.isSafeInteger(offset + size) ||
      !Number.isSafeInteger(time + duration)
    )
      fail();
    if (
      !mediaRanges.some(
        (range) => offset >= range.start && offset + size <= range.end,
      )
    )
      fail();
    if (++sampleCount > 10_000) fail();
    used.push({ start: offset, end: offset + size });
    totalTicks += duration;
    if (!Number.isSafeInteger(totalTicks)) fail();
    firstTick = Math.min(firstTick, time);
    lastTick = Math.max(lastTick, time + duration);
  };
  const stsz = required(table, "stsz");
  fullVersion(stsz);
  const fixedSize = u32(stsz.data + 4, stsz.end);
  const numberOfSamples = u32(stsz.data + 8, stsz.end);
  if (
    numberOfSamples > 10_000 ||
    stsz.data + 12 + (fixedSize ? 0 : numberOfSamples * 4) !== stsz.end
  )
    fail();
  const sizes = Array.from(
    { length: numberOfSamples },
    (_, index) => fixedSize || u32(stsz.data + 12 + index * 4, stsz.end),
  );
  const stts = required(table, "stts");
  fullVersion(stts);
  const timingCount = countAt(stts, stts.data + 4, 8);
  const durations: number[] = [];
  for (let index = 0; index < timingCount; index += 1) {
    const offset = stts.data + 8 + index * 8;
    const count = u32(offset, stts.end);
    const duration = u32(offset + 4, stts.end);
    if (!count || !duration || count > numberOfSamples - durations.length)
      fail();
    for (let sample = 0; sample < count; sample += 1) durations.push(duration);
  }
  if (durations.length !== numberOfSamples) fail();
  const ctts = one(table, "ctts", false);
  if (ctts) {
    fullVersion(ctts, [0, 1]);
    const entries = countAt(ctts, ctts.data + 4, 8);
    let count = 0;
    for (let index = 0; index < entries; index += 1) {
      count += u32(ctts.data + 8 + index * 8, ctts.end);
      if (u32(ctts.data + 12 + index * 8, ctts.end) !== 0) fail();
    }
    if (count !== numberOfSamples) fail();
  }
  let editSeconds = 0;
  const edts = one(trackChildren, "edts", false);
  if (edts) {
    const elst = required(children(edts), "elst");
    const editVersion = fullVersion(elst, [0, 1]);
    const entrySize = editVersion === 0 ? 12 : 20;
    const count = countAt(elst, elst.data + 4, entrySize);
    const mvhd = required(movie, "mvhd");
    const movieVersion = fullVersion(mvhd, [0, 1]);
    const movieScale = u32(
      mvhd.data + (movieVersion === 0 ? 12 : 20),
      mvhd.end,
    );
    if (!movieScale || !count) fail();
    let editTicks = 0;
    for (let index = 0; index < count; index += 1) {
      const offset = elst.data + 8 + index * entrySize;
      const length =
        editVersion === 0 ? u32(offset, elst.end) : u64(offset, elst.end);
      const rate = offset + (editVersion === 0 ? 8 : 16);
      if (u16(rate, elst.end) !== 1 || u16(rate + 2, elst.end) !== 0) fail();
      editTicks += length;
      if (!Number.isSafeInteger(editTicks)) fail();
    }
    editSeconds = editTicks / movieScale;
  }
  const stsc = required(table, "stsc");
  fullVersion(stsc);
  const mappingCount = countAt(stsc, stsc.data + 4, 12);
  const mapping: { first: number; count: number }[] = [];
  for (let index = 0; index < mappingCount; index += 1) {
    const offset = stsc.data + 8 + index * 12;
    const first = u32(offset, stsc.end);
    const count = u32(offset + 4, stsc.end);
    if (
      !first ||
      !count ||
      u32(offset + 8, stsc.end) !== 1 ||
      (index === 0 && first !== 1) ||
      (index > 0 && first <= mapping[index - 1].first)
    )
      fail();
    mapping.push({ first, count });
  }
  const stco = one(table, "stco", false);
  const co64 = one(table, "co64", false);
  if ((!stco && !co64) || (stco && co64)) fail();
  const chunks = stco ?? co64;
  if (!chunks) return fail();
  fullVersion(chunks);
  const chunkCount = countAt(chunks, chunks.data + 4, stco ? 4 : 8);
  if (
    (numberOfSamples > 0 && (!chunkCount || !mapping.length)) ||
    (numberOfSamples === 0 && (chunkCount || mapping.length))
  )
    fail();
  if (mapping.some((value) => value.first > chunkCount)) fail();
  let sampleIndex = 0;
  let mappingIndex = 0;
  let tick = 0;
  for (let chunk = 1; chunk <= chunkCount; chunk += 1) {
    while (
      mappingIndex + 1 < mapping.length &&
      mapping[mappingIndex + 1].first <= chunk
    )
      mappingIndex += 1;
    const count = mapping[mappingIndex].count;
    let offset = stco
      ? u32(chunks.data + 8 + (chunk - 1) * 4, chunks.end)
      : u64(chunks.data + 8 + (chunk - 1) * 8, chunks.end);
    if (count > numberOfSamples - sampleIndex) fail();
    for (let sample = 0; sample < count; sample += 1, sampleIndex += 1) {
      addSample(offset, sizes[sampleIndex], durations[sampleIndex], tick);
      offset += sizes[sampleIndex];
      tick += durations[sampleIndex];
    }
  }
  if (sampleIndex !== numberOfSamples) fail();
  const mvex = one(movie, "mvex", false);
  const trex = mvex ? required(children(mvex), "trex") : undefined;
  let defaultDuration = 0;
  let defaultSize = 0;
  if (trex) {
    fullVersion(trex);
    if (
      u32(trex.data + 4, trex.end) !== trackId ||
      u32(trex.data + 8, trex.end) !== 1
    )
      fail();
    defaultDuration = u32(trex.data + 12, trex.end);
    defaultSize = u32(trex.data + 16, trex.end);
  }
  for (const moof of top.filter((box) => box.type === "moof")) {
    if (!trex) fail();
    const fragment = children(required(children(moof), "traf"));
    const tfhd = required(fragment, "tfhd");
    fullVersion(tfhd);
    const flags = u32(tfhd.data, tfhd.end) & 0xffffff;
    if (flags & ~0x03003b) fail();
    if (u32(tfhd.data + 4, tfhd.end) !== trackId || flags & 0x010000) fail();
    let position = tfhd.data + 8;
    let base = moof.start;
    if (flags & 1) {
      base = u64(position, tfhd.end);
      position += 8;
    }
    if (flags & 2) {
      if (u32(position, tfhd.end) !== 1) fail();
      position += 4;
    }
    let duration = defaultDuration;
    let size = defaultSize;
    if (flags & 8) {
      duration = u32(position, tfhd.end);
      position += 4;
    }
    if (flags & 16) {
      size = u32(position, tfhd.end);
      position += 4;
    }
    if (flags & 32) position += 4;
    if (position !== tfhd.end) fail();
    const tfdt = required(fragment, "tfdt");
    const decodeVersion = fullVersion(tfdt, [0, 1]);
    let decodeTime =
      decodeVersion === 1
        ? u64(tfdt.data + 4, tfdt.end)
        : u32(tfdt.data + 4, tfdt.end);
    let dataEnd = base;
    const runs = fragment.filter((box) => box.type === "trun");
    if (!runs.length) fail();
    for (const run of runs) {
      fullVersion(run, [0, 1]);
      const runFlags = u32(run.data, run.end) & 0xffffff;
      if (runFlags & ~0x000f05) fail();
      const count = u32(run.data + 4, run.end);
      if (count > 10_000 - sampleCount) fail();
      position = run.data + 8;
      let dataOffset = dataEnd;
      if (runFlags & 1) {
        dataOffset = base + i32(position, run.end);
        position += 4;
      }
      if (runFlags & 4) position += 4;
      for (let index = 0; index < count; index += 1) {
        let sampleDuration = duration;
        let sampleSize = size;
        if (runFlags & 0x100) {
          sampleDuration = u32(position, run.end);
          position += 4;
        }
        if (runFlags & 0x200) {
          sampleSize = u32(position, run.end);
          position += 4;
        }
        if (runFlags & 0x400) position += 4;
        if (runFlags & 0x800) {
          if (u32(position, run.end) !== 0) fail();
          position += 4;
        }
        addSample(dataOffset, sampleSize, sampleDuration, decodeTime);
        dataOffset += sampleSize;
        decodeTime += sampleDuration;
      }
      if (position !== run.end) fail();
      dataEnd = dataOffset;
    }
  }
  if (!sampleCount) fail();
  used.sort((left, right) => left.start - right.start);
  for (let index = 1; index < used.length; index += 1)
    if (used[index].start < used[index - 1].end) fail();
  const seconds = Math.max(
    totalTicks / timescale,
    lastTick / timescale,
    (lastTick - firstTick) / timescale,
    (sampleCount * frameSamples) / sampleRate,
    editSeconds,
  );
  if (!Number.isFinite(seconds) || seconds <= 0) fail();
  return seconds;
}

/** Validate only bounded in-memory data; no upload is written to disk or Redis. */
export async function validateAudio(file: File): Promise<void> {
  if (file.size < 1 || file.size > MAX_AUDIO_BYTES) {
    throw new ApiError(
      400,
      "validation",
      "Record audio up to 12 seconds and 1 MB.",
    );
  }
  const mime = file.type.split(";", 1)[0].trim().toLowerCase();
  if (
    ![
      "audio/webm",
      "audio/wav",
      "audio/x-wav",
      "audio/wave",
      "audio/mp4",
      "audio/x-m4a",
    ].includes(mime)
  ) {
    throw new ApiError(
      400,
      "validation",
      "Please record audio as WebM, MP4 or WAV.",
    );
  }
  let seconds: number;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length !== file.size) invalidAudio();
    seconds =
      mime === "audio/webm"
        ? durationWebm(bytes)
        : mime === "audio/mp4" || mime === "audio/x-m4a"
          ? durationMp4(bytes)
          : durationWav(bytes);
    if (!Number.isFinite(seconds) || seconds <= 0) invalidAudio();
  } catch {
    throw new ApiError(
      400,
      "validation",
      "That recording could not be read. Please record it again.",
    );
  }
  if (seconds > MAX_AUDIO_SECONDS + 1e-9) {
    throw new ApiError(
      400,
      "validation",
      "Please keep the recording to 12 seconds or less.",
    );
  }
}
