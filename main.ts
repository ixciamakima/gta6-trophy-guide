// Leonida Trophy Atlas — entry program for the make.fun build.
//
// The shipped product is the static web app under app/. This program is the
// delivery step: it copies app/ and screenshots/ into the output directory
// and writes the dossier that describes them, using the kit's own
// buildDossier so the bytes match what the scorer computes.

import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(out, { recursive: true });

for (const part of ["app", "screenshots"]) {
  cpSync(join(root, part), join(out, part), { recursive: true });
}

const dossierBytes = buildDossier(out, {
  text_max_bytes: 163_840,
  screenshots: { max: 4, max_bytes: 262_144 },
  app_max_files: 993,
  app_max_bytes: 50_331_648,
});

writeFileSync(join(out, "dossier.json"), dossierBytes);
