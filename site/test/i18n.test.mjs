import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { engagementDestinationUrl, engagementUrl } from "../config.js";
import { createEmail, createMailto, formattedMessage, localizeFlyerUrl, messageParts, validateAnswers } from "../email.js";
import { defaultLanguage, languageCodes, languages, pack, resolveLanguage, t, translations } from "../i18n.js";
import { flyerContent, flyerLanguages } from "../tools/build-flyers.mjs";

const answers = { school: "Maple Grove Elementary", grade: "elementary", selectedInterests: ["coding", "virtual", "speakers"] };
const readSite = (name) => readFile(new URL(`../${name}`, import.meta.url), "utf8");

test("the picker offers exactly the reviewed languages with native labels", () => {
  assert.deepEqual(languageCodes, ["en", "es", "fr", "pt-br"]);
  assert.equal(defaultLanguage, "en");
  assert.deepEqual(languages.map((language) => language.label), ["English", "Español", "Français", "Português Brasileiro"]);
  assert.deepEqual(languages.map((language) => language.htmlLang), ["en", "es", "fr", "pt-BR"]);
});

test("requested, regional, and unknown languages resolve predictably", () => {
  assert.equal(resolveLanguage("es"), "es");
  assert.equal(resolveLanguage("PT-BR"), "pt-br");
  assert.equal(resolveLanguage("pt-PT"), "pt-br");
  assert.equal(resolveLanguage("es-MX"), "es");
  assert.equal(resolveLanguage("fr-CA"), "fr");
  assert.equal(resolveLanguage(null, ["de", "es-419"]), "es");
  assert.equal(resolveLanguage("klingon"), "en");
  assert.equal(resolveLanguage(undefined, []), "en");
  assert.equal(resolveLanguage({ toString: () => "es" }), "en");
});

test("every language defines the same keys, so no string can fall back silently", () => {
  const shape = (language) => {
    const entry = translations[language];
    return {
      grades: Object.keys(entry.grades).sort(),
      interests: Object.keys(entry.interests).sort(),
      email: Object.keys(entry.email).sort(),
      errors: Object.keys(entry.errors).sort(),
      status: Object.keys(entry.status).sort(),
      ui: Object.keys(entry.ui).sort(),
    };
  };
  const reference = shape(defaultLanguage);
  assert.deepEqual(reference.grades, ["elementary", "high", "middle", "mixed"]);
  assert.deepEqual(reference.interests, ["coding", "speakers", "virtual"]);
  assert.ok(reference.ui.length > 50);
  for (const code of languageCodes) {
    assert.deepEqual(shape(code), reference, `${code} must define the same keys as ${defaultLanguage}`);
    for (const [group, keys] of Object.entries(reference)) {
      for (const key of keys) {
        const value = translations[code][group][key];
        assert.ok(value, `${code}.${group}.${key} must not be empty`);
        if (typeof value === "string") assert.equal(value.trim(), value.replace(/^\s+|\s+$/g, ""));
      }
    }
  }
});

test("the Form label ends each form sentence so only the label becomes a link", () => {
  for (const code of languageCodes) {
    const entry = pack(code).email;
    assert.ok(entry.formIntro.endsWith(entry.formTail), `${code} formIntro must end with its formTail`);
    assert.ok(entry.formTail.trim().length > 0);
  }
});

test("each language produces a parent-voice email with all three real links", () => {
  const flyer = "https://angelica-salazar-code.github.io/parent-school-outreach/flyer.html";
  for (const code of languageCodes) {
    const localizedFlyer = localizeFlyerUrl(flyer, code);
    const draft = createEmail(answers, localizedFlyer, code);
    assert.ok(draft.subject.includes(answers.school));
    assert.ok(draft.body.includes(answers.school));
    assert.ok(draft.body.includes(pack(code).grades.elementary));
    for (const interest of Object.values(pack(code).interests)) assert.ok(draft.body.includes(interest), `${code} lists ${interest}`);
    assert.ok(draft.body.includes(engagementUrl));
    assert.ok(draft.body.includes(localizedFlyer));
    assert.ok(!draft.body.includes(engagementDestinationUrl));
    assert.doesNotMatch(draft.body, /85%|90%|23,737|attached|attachment/i);
    assert.ok(createMailto(draft, undefined, code).url, `${code} draft fits the email-link limit`);

    const parts = messageParts(draft.body, localizedFlyer, code);
    const linked = parts.filter((part) => part.href);
    assert.deepEqual(linked.map((part) => part.href).sort(), [engagementUrl, "https://nuevofoundation.org/", localizedFlyer].sort(), `${code} links`);
    const text = parts.map((part) => part.text).join("");
    assert.ok(!text.includes(engagementUrl), `${code} hides the raw form URL behind its label`);
    assert.ok(!text.includes(localizedFlyer), `${code} hides the raw flyer URL behind its label`);
    const html = formattedMessage(draft.body, localizedFlyer, code);
    for (const part of linked) assert.ok(html.includes(`<a href="${part.href}">${part.text}</a>`), `${code} formats ${part.text}`);
  }
});

test("validation errors and status messages are localized rather than English-only", () => {
  for (const code of languageCodes) {
    const errors = validateAnswers({ school: " ", grade: "", selectedInterests: [] }, code);
    assert.deepEqual(Object.keys(errors), ["school", "grade", "interests"]);
    for (const [key, message] of Object.entries(errors)) {
      assert.equal(message, pack(code).errors[key], `${code} reuses its own ${key} error`);
      if (code !== defaultLanguage) assert.notEqual(message, pack(defaultLanguage).errors[key], `${code} ${key} error must be translated`);
    }
    const blocked = createMailto({ subject: " ", body: "text" }, undefined, code);
    assert.equal(blocked.url, null);
    assert.ok(blocked.message);
  }
});

test("the flyer link switches to the reader's language without touching other URLs", () => {
  const base = "https://angelica-salazar-code.github.io/parent-school-outreach/flyer.html";
  assert.equal(localizeFlyerUrl(base, "en"), base);
  assert.equal(localizeFlyerUrl(base, "es"), base.replace("flyer.html", "flyer-es.html"));
  assert.equal(localizeFlyerUrl(base, "fr"), base.replace("flyer.html", "flyer-fr.html"));
  assert.equal(localizeFlyerUrl(base, "pt-br"), base.replace("flyer.html", "flyer-pt-br.html"));
  assert.equal(localizeFlyerUrl("", "es"), "");
  assert.equal(localizeFlyerUrl("https://example.org/brochure", "es"), "https://example.org/brochure");
  assert.equal(localizeFlyerUrl(base, "klingon"), base);
});

test("every translated key used by the page exists, and unused keys are not shipped", async () => {
  const html = await readSite("index.html");
  const used = new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const pair of match[1].split("|")) used.add(pair.split(":")[1]);
  }
  assert.ok(used.size > 40, "the page should be substantially translated");
  const defined = new Set(Object.keys(pack(defaultLanguage).ui));
  for (const key of used) assert.ok(defined.has(key), `index.html uses undefined key ${key}`);
  const appSource = await readSite("app.js");
  const referenced = new Set([...appSource.matchAll(/t\(\w+,\s*"([^"]+)"\)/g)].map((match) => match[1]));
  for (const key of defined) {
    assert.ok(used.has(key) || referenced.has(key), `unused translation key ${key}`);
  }
});

test("the page carries both language pickers, modelled on the workshops selector", async () => {
  const html = await readSite("index.html");
  for (const id of ["site-language", "email-language"]) {
    const select = html.match(new RegExp(`<select id="${id}"[^>]*>`))[0];
    assert.match(select, /class="language-selector"/);
    assert.ok(/aria-label=|aria-labelledby=/.test(select) || html.includes(`for="${id}"`), `${id} needs an accessible name`);
  }
  // Options are built from the translation file, so none are hard-coded here.
  assert.doesNotMatch(html, /<option value="pt-br"/);
  const css = await readSite("styles.css");
  assert.match(css, /\.language-selector \{[^}]*min-height: 44px/);
  assert.match(css, /\.language-selector:focus-visible/);
});

test("the site language travels in the address only, never in storage", async () => {
  const appSource = await readSite("app.js");
  assert.match(appSource, /searchParams\.set\("lang"/);
  assert.match(appSource, /history\.replaceState/);
  assert.doesNotMatch(appSource, /localStorage|sessionStorage|document\.cookie|innerHTML/);
});

test("a translated flyer exists for every language and stays script-free", async () => {
  assert.deepEqual(flyerLanguages.map((language) => language.code), languageCodes);
  const english = await readSite("flyer.html");
  for (const code of languageCodes) {
    const content = flyerContent[code];
    const html = await readSite(content.file);
    assert.match(html, new RegExp(`<html lang="${content.htmlLang}"`), `${code} declares its language`);
    assert.ok(html.includes(`<title>${content.title}</title>`));
    assert.ok(html.includes(content.headline));
    assert.doesNotMatch(html, /<script|download=|nuevo-foundation-flyer\.png/i);
    assert.ok(html.includes("connect-src 'none'"));
    assert.ok(html.includes(engagementDestinationUrl), `${code} flyer links the real form`);
    // Numbers are Nuevo Foundation's published figures and are never restated.
    for (const [, value] of content.metrics) assert.ok(html.includes(value));
    assert.equal(content.metrics.length, 6);
    for (const other of languageCodes) {
      assert.ok(html.includes(`href="./${flyerContent[other].file}"`), `${code} flyer links to ${other}`);
    }
    assert.ok(html.includes('aria-current="true"'));
    if (code !== defaultLanguage) {
      assert.notEqual(content.headline, flyerContent[defaultLanguage].headline);
      assert.equal(html.split("\n").length, english.split("\n").length, `${code} flyer keeps the approved layout`);
    }
  }
});

test("the flyer language row is styled for touch and hidden when printed", async () => {
  const css = await readSite("flyer.css");
  assert.match(css, /\.flyer-languages a \{[^}]*min-height: 44px/);
  assert.match(css, /@media print \{[\s\S]*\.flyer-languages \{ display: none; \}/);
});
