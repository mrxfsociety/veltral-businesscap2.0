/*
 * The Veltral logo (public/brand/veltral/veltral-logo.svg), inlined so it
 * follows the landing theme: ring and letters take the current ink colour,
 * the dot keeps the brand's brick orange in both themes.
 * The viewBox is cropped to the artwork; the source file keeps its margins.
 */
export function VeltralLogo({
  className,
  title = "Veltral",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="38 40 456 128"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M152.52 97.18A49 49 0 1 1 93.81 56.07"
        fill="none"
        stroke="currentColor"
        strokeWidth="21"
        strokeLinecap="round"
      />
      <circle cx="132.11" cy="63.86" r="12.5" fill="#C2522B" />
      <path
        fill="currentColor"
        d="M260.01 72.26 236 136.2H223.85L199.75 72.26H210.97L229.92 125.44L248.97 72.26Z M313.84 114.76H275.11Q275.57 120.84 279.62 124.52Q283.66 128.2 289.55 128.2Q298.02 128.2 301.51 121.11H312.83Q310.53 128.1 304.5 132.57Q298.48 137.03 289.55 137.03Q282.28 137.03 276.53 133.76Q270.78 130.5 267.52 124.56Q264.25 118.63 264.25 110.81Q264.25 102.99 267.43 97.05Q270.6 91.12 276.35 87.9Q282.1 84.68 289.55 84.68Q296.73 84.68 302.34 87.81Q307.95 90.94 311.08 96.59Q314.21 102.25 314.21 109.61Q314.21 112.46 313.84 114.76ZM303.26 106.3Q303.17 100.5 299.12 97.01Q295.07 93.51 289.09 93.51Q283.66 93.51 279.8 96.96Q275.94 100.41 275.2 106.3Z M334 68.12V136.2H323.51V68.12Z M359.04 94.06V122.12Q359.04 124.98 360.37 126.22Q361.7 127.46 364.92 127.46H371.36V136.2H363.08Q356 136.2 352.23 132.89Q348.46 129.58 348.46 122.12V94.06H342.48V85.51H348.46V72.9H359.04V85.51H371.36V94.06Z M405.69 84.68V95.54H403.02Q396.86 95.54 393.69 98.66Q390.51 101.79 390.51 109.52V136.2H380.02V85.51H390.51V92.87Q392.81 89 396.63 86.84Q400.45 84.68 405.69 84.68Z M434.78 84.68Q440.76 84.68 445.22 87.03Q449.68 89.37 452.35 92.87V85.51H462.93V136.2H452.35V128.66Q449.68 132.24 445.08 134.64Q440.48 137.03 434.59 137.03Q428.06 137.03 422.63 133.67Q417.2 130.31 414.03 124.29Q410.86 118.26 410.86 110.62Q410.86 102.99 414.03 97.1Q417.2 91.21 422.68 87.95Q428.15 84.68 434.78 84.68ZM436.98 93.79Q432.94 93.79 429.44 95.77Q425.94 97.74 423.78 101.56Q421.62 105.38 421.62 110.62Q421.62 115.87 423.78 119.82Q425.94 123.78 429.49 125.85Q433.03 127.92 436.98 127.92Q441.03 127.92 444.53 125.9Q448.02 123.87 450.19 119.96Q452.35 116.05 452.35 110.81Q452.35 105.56 450.19 101.7Q448.02 97.84 444.53 95.81Q441.03 93.79 436.98 93.79Z M486.22 68.12V136.2H475.73V68.12Z"
      />
    </svg>
  );
}

/** Just the ring and the dot, for small marks inside the page. */
export function VeltralMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="38 40 132 128"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M152.52 97.18A49 49 0 1 1 93.81 56.07"
        fill="none"
        stroke="currentColor"
        strokeWidth="21"
        strokeLinecap="round"
      />
      <circle cx="132.11" cy="63.86" r="12.5" fill="#C2522B" />
    </svg>
  );
}
