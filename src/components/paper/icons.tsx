import type { SVGProps } from "react";

/*
 * Cut-paper glyphs. Solid shapes on a 24-unit grid, filled with currentColor.
 * Edges are straight cuts or single arcs, as if snipped from one sheet.
 * No icon pack: every path below is authored here.
 */

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function polar(cx: number, cy: number, r: number, degrees: number) {
  const a = (degrees * Math.PI) / 180;
  return `${round(cx + r * Math.cos(a))} ${round(cy + r * Math.sin(a))}`;
}

function starPath(cx: number, cy: number, outer: number, inner: number) {
  const points = Array.from({ length: 10 }, (_, k) =>
    polar(cx, cy, k % 2 ? inner : outer, -90 + k * 36),
  );
  return `M${points.join(" L")} Z`;
}

function sunPath() {
  const rays = Array.from({ length: 8 }, (_, k) => {
    const angle = k * 45 - 90;
    return `M${polar(12, 12, 6.4, angle - 12)} L${polar(12, 12, 10.6, angle)} L${polar(12, 12, 6.4, angle + 12)} Z`;
  });
  return `M12 7.4 A4.6 4.6 0 1 1 11.99 7.4 Z ${rays.join(" ")}`;
}

const PATHS = {
  check: "M3.4 12.7 L6.3 9.9 L10 13.4 L17.8 4.5 L20.7 7.1 L10.1 19 Z",
  cross:
    "M5.2 3.3 L12 10.1 L18.7 3.5 L20.6 5.4 L13.9 12 L20.5 18.7 L18.6 20.6 L12 13.9 L5.4 20.5 L3.5 18.6 L10.1 12 L3.3 5.3 Z",
  rewind:
    "M9.09 5.01 A8.5 8.5 0 1 0 18.51 7.53 L20.43 5.93 L13.96 4.83 L13.92 11.39 L15.83 9.79 A5 5 0 1 1 10.29 8.3 Z",
  star: starPath(12, 12.6, 9.6, 4.2),
  cloud:
    "M6.5 18.6 C3.6 18.6 2 16.6 2 14.5 C2 12.3 3.8 10.7 5.9 10.8 C6.4 7.7 8.9 5.6 12 5.6 C14.9 5.6 17.2 7.5 17.8 10.2 C20.3 10.3 22 12.2 22 14.4 C22 16.7 20.3 18.6 17.9 18.6 Z",
  sun: sunPath(),
  moon: "M15.4 3.1 A9.3 9.3 0 1 0 20.9 16.5 A7.5 7.5 0 0 1 15.4 3.1 Z",
  lock: "M6.9 10.4 V8.1 A5.1 5.1 0 0 1 17.1 8.1 V10.4 H18.7 V20.6 H5.3 V10.4 Z M9.5 10.4 H14.5 V8.1 A2.5 2.5 0 0 0 9.5 8.1 Z M12 13.5 A1.6 1.6 0 0 0 11.25 16.5 V18.2 H12.75 V16.5 A1.6 1.6 0 0 0 12 13.5 Z",
  ticket:
    "M2.8 6.3 H21.2 V9.9 A2.1 2.1 0 0 0 21.2 14.1 V17.7 H2.8 V14.1 A2.1 2.1 0 0 0 2.8 9.9 Z M14.6 8 H15.9 V9.9 H14.6 Z M14.6 11.05 H15.9 V12.95 H14.6 Z M14.6 14.1 H15.9 V16 H14.6 Z",
  flame:
    "M12 2.4 C13 6 17.6 8.2 17.6 13.7 C17.6 17.7 15 20.9 12 20.9 C9 20.9 6.4 18.5 6.4 14.8 C6.4 12.1 8 10.6 9 9.3 C9.3 11.2 10 12.1 11 12.4 C10.6 9.1 11.2 5.6 12 2.4 Z",
  speaker:
    "M3.4 9 H7.5 L13 4.4 V19.6 L7.5 15 H3.4 Z M15.4 8.4 L16.7 7.1 A6.7 6.7 0 0 1 16.7 16.9 L15.4 15.6 A4.9 4.9 0 0 0 15.4 8.4 Z M18.1 5.6 L19.4 4.3 A10.6 10.6 0 0 1 19.4 19.7 L18.1 18.4 A8.8 8.8 0 0 0 18.1 5.6 Z",
  speakerOff:
    "M3.4 9 H7.5 L13 4.4 V19.6 L7.5 15 H3.4 Z M15.1 9.3 L16.4 8 L18.4 10 L20.4 8 L21.7 9.3 L19.7 11.3 L21.7 13.3 L20.4 14.6 L18.4 12.6 L16.4 14.6 L15.1 13.3 L17.1 11.3 Z",
  microphone:
    "M9 5.9 A3 3 0 0 1 15 5.9 V11.8 A3 3 0 0 1 9 11.8 Z M5.9 10.9 H7.6 A4.4 4.4 0 0 0 16.4 10.9 H18.1 A6.1 6.1 0 0 1 12.85 16.95 V19.5 H15.8 V21.1 H8.2 V19.5 H11.15 V16.95 A6.1 6.1 0 0 1 5.9 10.9 Z",
  play: "M6.8 4.3 L19.6 12 L6.8 19.7 Z",
  copy: "M8.4 2.9 H19.2 V16.6 H17.1 V5 H8.4 Z M4.6 7 H15.1 V21.1 H4.6 Z",
  share:
    "M12 2.7 L17.1 7.8 L15.6 9.3 L13.05 6.75 V15 H10.95 V6.75 L8.4 9.3 L6.9 7.8 Z M4.4 11 H8.1 V13.1 H6.5 V18.9 H17.5 V13.1 H15.9 V11 H19.6 V21 H4.4 Z",
  arrow:
    "M3.4 10.8 H15.4 L10.9 6.3 L12.6 4.6 L20.1 12 L12.6 19.4 L10.9 17.7 L15.4 13.2 H3.4 Z",
  back: "M20.6 10.8 H8.6 L13.1 6.3 L11.4 4.6 L3.9 12 L11.4 19.4 L13.1 17.7 L8.6 13.2 H20.6 Z",
  stage:
    "M2.8 3.6 H21.2 V20.4 H18 V8.6 C15.4 10.4 8.6 10.4 6 8.6 V20.4 H2.8 Z M7.6 17.6 H16.4 V20.4 H7.6 Z",
  chart:
    "M3.8 13 H7.3 V20.2 H3.8 Z M10.25 7.6 H13.75 V20.2 H10.25 Z M16.7 3.8 H20.2 V20.2 H16.7 Z",
  script:
    "M5 2.7 H15.4 L19.4 6.7 V21.3 H5 Z M8 9.8 H16 V11.4 H8 Z M8 13.3 H16 V14.9 H8 Z M8 16.8 H12.8 V18.4 H8 Z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  title,
  ...rest
}: { name: IconName; size?: number; title?: string } & Omit<
  SVGProps<SVGSVGElement>,
  "children"
>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      fillRule="evenodd"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
      {...rest}
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name]} />
    </svg>
  );
}

export const ICON_NAMES = Object.keys(PATHS) as IconName[];
