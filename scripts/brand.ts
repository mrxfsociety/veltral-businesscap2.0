import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/*
 * Raster exports of authored SVG only; no network and no image generation.
 * Run from the repository root: node --import tsx scripts/brand.ts
 * Sharp is already installed by Next.js; this adds no package dependency.
 */
async function main() {
  const root = process.cwd();
  const brand = path.join(root, "public/brand");
  const full = await readFile(path.join(brand, "mark.svg"), "utf8");
  const simple = await readFile(path.join(brand, "mark-simple.svg"), "utf8");
  for (const source of [full, simple]) {
    assert.match(source, /viewBox="0 0 64 64"/);
    assert.ok((source.match(/<path\b/g) ?? []).length <= 12);
    assert.doesNotMatch(
      source,
      /<(?:image|text|linearGradient|radialGradient)\b/,
    );
  }
  assert.doesNotMatch(simple, /<(?:filter|feGaussianBlur)\b/);
  await writeFile(path.join(root, "src/app/icon.svg"), simple);

  async function png(svg: string, filename: string, size: number) {
    const data = await sharp(Buffer.from(svg), { density: 192 })
      .resize(size, size)
      .png()
      .toBuffer();
    const metadata = await sharp(data).metadata();
    assert.equal(metadata.width, size);
    assert.equal(metadata.height, size);
    await writeFile(filename, data);
  }

  await png(full, path.join(root, "src/app/apple-icon.png"), 180);
  await png(full, path.join(brand, "icon-192.png"), 192);
  await png(full, path.join(brand, "icon-512.png"), 512);

  const inside = full
    .replace(/^[\s\S]*?<svg\b[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<!-- Opaque full-bleed paper. Critical artwork is inset to 384 px; the loop and tip fit inside the central 80%-diameter safe circle. -->
<rect width="512" height="512" fill="#F4ECDD"/>
<svg x="64" y="64" width="384" height="384" viewBox="0 0 64 64">${inside}</svg>
</svg>`;
  await writeFile(path.join(brand, "icon-maskable.svg"), maskable);
  await png(maskable, path.join(brand, "icon-maskable-512.png"), 512);

  // One comparison sheet; requested sizes are literal SVG pixel dimensions.
  const panels: string[] = [];
  for (const [index, id] of ["a", "b", "c"].entries()) {
    for (const [backgroundIndex, background] of [
      "#F4ECDD",
      "#5E3B55",
    ].entries()) {
      const x = backgroundIndex * 900;
      const y = index * 610;
      const foreground = backgroundIndex ? "#F4ECDD" : "#1E2740";
      panels.push(
        `<rect x="${x}" y="${y}" width="900" height="610" fill="${background}"/>`,
      );
      panels.push(
        `<text x="${x + 24}" y="${y + 34}" font-family="Fraunces,serif" font-size="20" fill="${foreground}">Candidate ${id.toUpperCase()} · ${backgroundIndex ? "plum" : "cream"}</text>`,
      );
      let offset = 24;
      for (const size of [16, 32, 180, 512]) {
        const filename = `mark-${id}${size <= 32 ? "-simple" : ""}.svg`;
        const svg = await readFile(path.join(brand, "candidates", filename));
        panels.push(
          `<image x="${x + offset}" y="${y + 70 + (512 - size) / 2}" width="${size}" height="${size}" href="data:image/svg+xml;base64,${svg.toString("base64")}"/>`,
        );
        panels.push(
          `<text x="${x + offset}" y="${y + 603}" font-family="Fraunces,serif" font-size="12" fill="${foreground}">${size}px</text>`,
        );
        offset += size + 32;
      }
    }
  }
  const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1830" viewBox="0 0 1800 1830" role="img" aria-label="Three Do-Over mark candidates at 16, 32, 180 and 512 pixels on cream and plum">${panels.join("\n")}</svg>`;
  await writeFile(path.join(brand, "candidates", "comparison.svg"), sheet);
  await sharp(Buffer.from(sheet))
    .png()
    .toFile(path.join(brand, "candidates", "comparison.png"));
  process.stdout.write(
    "Brand exports: 180, 192, 512, maskable 512; candidate comparison 1800×1830.\n",
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exitCode = 1;
});
