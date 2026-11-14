import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const inline = process.argv
  .find((argument) => argument.startsWith("--provider="))
  ?.slice("--provider=".length);
const position = process.argv.indexOf("--provider");
const provider =
  inline ?? (position >= 0 ? process.argv[position + 1] : undefined);
if (provider !== "openai" && provider !== "anthropic") {
  process.stderr.write(
    "Choose exactly one provider: --provider=openai or --provider=anthropic. Only dev data is measured.\n",
  );
  process.exitCode = 1;
} else {
  const child = spawn(
    process.execPath,
    [
      "--conditions=react-server",
      "--import=tsx",
      fileURLToPath(new URL("./run.ts", import.meta.url)),
      "--model",
      "--dev-only",
      `--provider=${provider}`,
    ],
    { stdio: "inherit", env: process.env },
  );
  child.once("error", () => {
    process.stderr.write("Could not start the dev-only provider evaluation.\n");
    process.exitCode = 1;
  });
  child.once("exit", (code) => {
    process.exitCode = code ?? 1;
  });
}
