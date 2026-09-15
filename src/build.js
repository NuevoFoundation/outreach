/**
 * Builds every email in content/ into ready-to-send HTML and plain text files
 * under dist/.
 *
 * Usage:
 *   npm run build              build every email
 *   npm run build -- <name>    build a single email (content file name without .json)
 */

import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { htmlToText, render } from './render.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const TEMPLATE_DIR = path.join(ROOT, 'templates');
const DIST_DIR = path.join(ROOT, 'dist');
const DEFAULTS_FILE = 'defaults.json';

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

export async function listEmails() {
  const files = await readdir(CONTENT_DIR);
  return files
    .filter((file) => file.endsWith('.json') && file !== DEFAULTS_FILE)
    .map((file) => path.basename(file, '.json'))
    .sort();
}

export async function buildEmail(name) {
  const defaults = await readJson(path.join(CONTENT_DIR, DEFAULTS_FILE));
  const content = await readJson(path.join(CONTENT_DIR, `${name}.json`));
  const data = { ...defaults, ...content };

  if (!data.template) {
    throw new Error(`${name}.json is missing a "template" field`);
  }
  if (!data.subject) {
    throw new Error(`${name}.json is missing a "subject" field`);
  }

  const templateFile = path.join(TEMPLATE_DIR, `${path.basename(data.template)}.html`);
  const layout = await readFile(path.join(TEMPLATE_DIR, 'layout.html'), 'utf8');
  const template = await readFile(templateFile, 'utf8');

  const body = render(template, data);
  const html = render(layout, { ...data, body });

  return { name, subject: data.subject, html, text: htmlToText(body) };
}

async function main() {
  const requested = process.argv.slice(2);
  const names = requested.length > 0 ? requested : await listEmails();

  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });

  for (const name of names) {
    const email = await buildEmail(name);
    await writeFile(path.join(DIST_DIR, `${name}.html`), `${email.html}\n`);
    await writeFile(path.join(DIST_DIR, `${name}.txt`), `${email.text}\n`);
    console.log(`Built ${name}\n  subject: ${email.subject}`);
  }

  console.log(`\n${names.length} email(s) written to dist/`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
