import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { engagementDestinationUrl, engagementUrl, verifiedFlyerUrl } from "../config.js";
import { copyFormattedMessage, copyText, createEmail, createMailto, formattedMessage, grades, interests, mailtoLimit, messageParts, validateAnswers, validateFlyerUrl } from "../email.js";

const answers = { school: "Maple Grove Elementary", grade: "elementary", selectedInterests: ["coding"] };

test("grade choices match the template and exclude kindergarten", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const select = html.match(/<select id="grade"[^>]*>([\s\S]*?)<\/select>/)[1];
  const values = [...select.matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(values, ["elementary", "middle", "high", "mixed"]);
  assert.deepEqual(values, Object.keys(grades));
  assert.ok(validateAnswers({ ...answers, grade: "kindergarten" }).grade);
  assert.throws(() => createEmail({ ...answers, grade: "kindergarten" }), /Choose a grade level/);
});

test("templates cover every grade and nonempty interest combination in a parent's voice", () => {
  const keys = Object.keys(interests);
  for (const grade of Object.keys(grades)) {
    for (let mask = 1; mask < 8; mask++) {
      const selectedInterests = keys.filter((_, index) => mask & (1 << index));
      const email = createEmail({ ...answers, grade, selectedInterests });
      assert.match(email.body, /I'm a parent/);
      assert.ok(email.body.includes(grades[grade]));
      for (const interest of selectedInterests) assert.ok(email.body.includes(interests[interest]));
      assert.ok(email.body.includes(engagementUrl));
      assert.ok(!email.body.includes(engagementDestinationUrl));
      assert.match(email.body, /\[Your name\]$/);
      assert.doesNotMatch(email.body, /I (?:work|coordinate)|our volunteers|guarantee|free|85%|90%|23,737|Ana Torres/);
      assert.ok(createMailto(email).url, "Normal drafts should fit the email-link limit");
    }
  }
});

test("no fabricated flyer link, attachment claim, or unrelated interests", () => {
  const email = createEmail(answers);
  assert.doesNotMatch(email.body, /Here is Nuevo Foundation's flyer|attached|localhost|STEM speakers|virtual sessions/);
  assert.equal(validateFlyerUrl(verifiedFlyerUrl), verifiedFlyerUrl);
  const configured = createEmail(answers, "https://nuevofoundation.org/outreach/flyer.html");
  assert.ok(configured.body.includes("https://nuevofoundation.org/outreach/flyer.html"));
});

test("school names remain text and whitespace is normalized", () => {
  const email = createEmail({ ...answers, school: '  St. Anne & <Friends> "School"\n North ' });
  assert.ok(email.subject.endsWith('St. Anne & <Friends> "School" North?'));
  assert.ok(email.body.startsWith('Hello St. Anne & <Friends> "School" North team,'));
  assert.ok(createEmail({ ...answers, school: "Escuela Niñez 学校" }).body.includes("Niñez 学校"));
});

test("missing, invalid, and oversized answers produce explicit errors", () => {
  assert.deepEqual(Object.keys(validateAnswers({ school: " ", grade: "", selectedInterests: [] })), ["school", "grade", "interests"]);
  assert.ok(validateAnswers({ ...answers, school: "a".repeat(121) }).school);
  assert.ok(validateAnswers({ ...answers, grade: "constructor" }).grade);
  assert.ok(validateAnswers({ ...answers, selectedInterests: ["toString"] }).interests);
  assert.ok(validateAnswers({ ...answers, selectedInterests: null }).interests);
  assert.throws(() => createEmail({ ...answers, school: "" }), /school's name/);
  assert.deepEqual(validateAnswers({ ...answers, school: "a".repeat(120) }), {});
  const email = createEmail({ ...answers, selectedInterests: ["coding", "coding"] });
  assert.equal(email.body.match(/coding workshops/g).length, 1);
});

test("flyer configuration rejects local, placeholder, insecure, and form addresses", () => {
  assert.equal(validateFlyerUrl(""), "");
  for (const url of [
    "bad", "/flyer.html", "http://nuevofoundation.org/flyer",
    "https://localhost/flyer", "https://localhost.localdomain/flyer",
    "https://127.0.0.1/flyer", "https://192.168.1.10/flyer", "https://[::1]/flyer",
    "https://preview.local/flyer", "https://preview.test/flyer",
    "https://example.com/flyer", "https://user:password@nuevofoundation.org/flyer",
    engagementUrl, engagementDestinationUrl,
  ]) {
    assert.throws(() => validateFlyerUrl(url), Error, url);
  }
});

test("mailto round-trips special characters, preserves edits, and normalizes line endings", () => {
  const draft = { subject: "A & B? #1 + 你好", body: "An edited message & recipient@example.org\nSecond line\rThird\r\nFourth" };
  const result = createMailto(draft);
  const url = new URL(result.url);
  assert.equal(url.pathname, "");
  assert.equal(url.searchParams.get("subject"), draft.subject);
  assert.equal(url.searchParams.get("body"), draft.body.replace(/\r\n|\r|\n/g, "\r\n"));
  assert.equal(url.searchParams.has("to"), false);
  assert.equal(url.searchParams.has("attachment"), false);
  const header = new URL(createMailto({ subject: "Hi\r\nbcc:person@example.org", body: "text" }).url);
  assert.equal(header.searchParams.has("bcc"), false);
  assert.equal(header.searchParams.get("subject"), "Hi bcc:person@example.org");
});

test("mailto fallback checks actual encoded length and invalid drafts", () => {
  const draft = { subject: "Hello", body: "Normal text" };
  const length = createMailto(draft).url.length;
  assert.ok(createMailto(draft, length).url);
  assert.equal(createMailto(draft, length - 1).url, null);
  assert.equal(createMailto({ subject: "Hello", body: "你好".repeat(150) }).url, null);
  assert.ok(createMailto({ subject: "Hello", body: "x".repeat(mailtoLimit) }).message.includes("Copy"));
  assert.equal(createMailto({ subject: " ", body: "text" }).url, null);
  assert.equal(createMailto({ subject: "subject", body: " " }).url, null);
  assert.match(createMailto({ subject: "\ud800", body: "text" }).message, /character/);
});

test("clipboard success, denied permission, and missing support are explicit", async () => {
  let copied;
  assert.equal((await copyText("My edits", { writeText: async (text) => { copied = text; } })).ok, true);
  assert.equal(copied, "My edits");
  assert.match((await copyText("My edits", undefined)).message, /Copy command/);
  const denied = await copyText("My edits", { writeText: async () => { throw new Error("Permission denied"); } });
  assert.equal(denied.ok, false);
  assert.match(denied.message, /browser could not copy/);
});

test("formatted preview links only the word Form to the actual short URL", () => {
  const body = createEmail(answers).body;
  const parts = messageParts(body);
  assert.deepEqual(parts.filter((part) => part.href === engagementUrl), [{ text: "Form", href: engagementUrl }]);
  const text = parts.map((part) => part.text).join("");
  assert.ok(text.includes("Nuevo Foundation's Programs Interest Form"));
  assert.ok(!text.includes(engagementUrl));
  assert.ok(formattedMessage(body).includes(`<a href="${engagementUrl}">Form</a>`));
  assert.equal(messageParts("I removed the link.").filter((part) => part.href).length, 0);
  assert.equal(messageParts(`${engagementUrl}different`).filter((part) => part.href).length, 0);
});

test("formatted copying escapes parent edits rather than accepting HTML", () => {
  const html = formattedMessage(`<img src=x onerror="alert('x')">\n<script>alert(1)</script>\n${engagementUrl}`);
  assert.ok(html.includes("&lt;img"));
  assert.ok(html.includes("&quot;"));
  assert.doesNotMatch(html, /<script|<img|onerror="/);
  assert.equal((html.match(/<a /g) || []).length, 1);
});

test("Nuevo Foundation in the introduction links to the official website", async () => {
  const body = createEmail(answers).body;
  const parts = messageParts(body);
  assert.deepEqual(parts.filter((part) => part.href === "https://nuevofoundation.org/"), [
    { text: "Nuevo Foundation", href: "https://nuevofoundation.org/" },
  ]);
  assert.ok(parts.map((part) => part.text).join("").includes("I came across Nuevo Foundation and thought"));
  const linkedSentence = 'I came across <a href="https://nuevofoundation.org/">Nuevo Foundation</a> and thought';
  assert.ok(formattedMessage(body).includes(linkedSentence));
  assert.equal(messageParts("Nuevo Foundation's Programs Interest Form").some((part) => part.href), false);
  class Item { constructor(data) { this.data = data; } }
  let copied;
  await copyFormattedMessage(body, { write: async (items) => { copied = items[0].data; } }, { ClipboardItemType: Item });
  assert.ok((await copied["text/html"].text()).includes(linkedSentence));
  assert.equal(await copied["text/plain"].text(), body);
});

test("formatted clipboard contains both a linked Form and the plain-text URL", async () => {
  class Item { constructor(data) { this.data = data; } }
  let copied;
  const body = createEmail(answers).body;
  const result = await copyFormattedMessage(body, { write: async (items) => { copied = items[0].data; } }, { ClipboardItemType: Item });
  assert.equal(result.ok, true);
  assert.match(result.message, /formatted message/);
  assert.equal(await copied["text/plain"].text(), body);
  assert.ok((await copied["text/html"].text()).includes(`<a href="${engagementUrl}">Form</a>`));
});

test("formatted clipboard failures explicitly fall back to plain text or manual copy", async () => {
  class Item { constructor(data) { this.data = data; } }
  let copied;
  const clipboard = {
    write: async () => { throw new Error("HTML denied"); },
    writeText: async (text) => { copied = text; },
  };
  const result = await copyFormattedMessage("My edited text", clipboard, { ClipboardItemType: Item });
  assert.equal(result.ok, true);
  assert.equal(copied, "My edited text");
  assert.match(result.message, /Copied as plain text/);
  assert.match((await copyFormattedMessage("text", clipboard, undefined)).message, /plain text/);
  assert.equal((await copyFormattedMessage("text", undefined, undefined)).ok, false);
  clipboard.writeText = async () => { throw new Error("All copying denied"); };
  assert.equal((await copyFormattedMessage("text", clipboard, { ClipboardItemType: Item })).ok, false);
});

test("a verified hosted flyer becomes a clickable preview and copied-email link", async () => {
  const flyerUrl = "https://nuevofoundation.org/outreach/flyer.html";
  const draft = createEmail(answers, flyerUrl);
  const parts = messageParts(draft.body, flyerUrl);
  assert.deepEqual(parts.filter((part) => part.href === flyerUrl), [{ text: "View the flyer", href: flyerUrl }]);
  assert.ok(!parts.map((part) => part.text).join("").includes(flyerUrl));
  assert.ok(formattedMessage(draft.body, flyerUrl).includes(`<a href="${flyerUrl}">View the flyer</a>`));
  class Item { constructor(data) { this.data = data; } }
  let copied;
  await copyFormattedMessage(draft.body, { write: async (items) => { copied = items[0].data; } }, { ClipboardItemType: Item, flyerUrl });
  assert.ok((await copied["text/html"].text()).includes(`<a href="${flyerUrl}">View the flyer</a>`));
  assert.ok((await copied["text/plain"].text()).includes(flyerUrl));
  assert.equal(messageParts(createEmail(answers).body).filter((part) => part.text === "View the flyer").length, 0);
});

test("email preview and flyer buttons consistently use the verified short link", async () => {
  assert.equal(engagementUrl, "https://angelica-salazar-code.github.io/parent-school-outreach/form.html");
  assert.ok(engagementUrl.length < engagementDestinationUrl.length);
  const draft = createEmail(answers);
  assert.ok(draft.body.includes(engagementUrl));
  assert.ok(!draft.body.includes(engagementDestinationUrl));
  assert.ok(new URL(createMailto(draft).url).searchParams.get("body").includes(engagementUrl));
  for (const filename of ["index.html", "flyer.html"]) {
    const html = await readFile(new URL(`../${filename}`, import.meta.url), "utf8");
    const links = [...html.matchAll(/href="(https:\/\/[^"]+)"/g)].map((match) => match[1]);
    assert.equal(links.length, 2);
    for (const link of links) assert.equal(link, engagementDestinationUrl);
    assert.ok(!html.includes("tinyurl.com"));
    assert.ok(html.includes("connect-src 'none'"));
    assert.ok(html.includes("form-action 'none'"));
    assert.ok(html.includes('class="flyer-hotspot"'));
    assert.ok(html.includes('download="Nuevo-Foundation-flyer.png"'));
  }
});

test("first-party form link redirects to the exact Microsoft Form with a manual fallback", async () => {
  const html = await readFile(new URL("../form.html", import.meta.url), "utf8");
  assert.ok(html.includes(`content="0;url=${engagementDestinationUrl}"`));
  assert.ok(html.includes(`href="${engagementDestinationUrl}"`));
  assert.doesNotMatch(html, /tinyurl\.com|<script|<form[\s>]/);
});

test("flyer hosted on the same site as the short link remains valid", () => {
  const flyer = "https://angelica-salazar-code.github.io/parent-school-outreach/flyer.html";
  assert.equal(validateFlyerUrl(flyer), flyer);
  assert.ok(createEmail(answers, flyer).body.includes(flyer));
  assert.throws(() => validateFlyerUrl(engagementUrl));
});

test("step three shares the flyer as a page link rather than an attachment", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const step = html.match(/<div class="send-box">([\s\S]*?)<p id="draft-status"/)[1];
  assert.match(step, /id="view-email-flyer"[^>]+href="\.\/flyer\.html"/);
  assert.match(step, /id="open-email"/);
  assert.doesNotMatch(step, /download=|Download flyer|Attach file|paperclip/);
  assert.match(step, /including "View the flyer."/);
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css, /\.send-actions \{[^}]*flex-wrap: wrap/);
});

test("configured flyer link survives email-app encoding and formatted copy", () => {
  assert.ok(verifiedFlyerUrl);
  const draft = createEmail(answers, verifiedFlyerUrl);
  assert.ok(formattedMessage(draft.body, verifiedFlyerUrl).includes(`<a href="${verifiedFlyerUrl}">View the flyer</a>`));
  const mailto = new URL(createMailto(draft).url);
  assert.ok(mailto.searchParams.get("body").includes(verifiedFlyerUrl));
  assert.equal(mailto.searchParams.has("attachment"), false);
  assert.doesNotMatch(draft.body, /attached|attachment/i);
});
test("the supplied flyer is preserved byte-for-byte and the local logo is present", async () => {
  const image = await readFile(new URL("../assets/nuevo-foundation-flyer.png", import.meta.url));
  assert.equal(createHash("sha256").update(image).digest("hex"), "2dc8f8a1632baa2738112b3a64d33bbd1cca883d3362e637ff4ee671e7fab398");
  assert.equal(image.readUInt32BE(16), 538);
  assert.equal(image.readUInt32BE(20), 683);
  const logo = await readFile(new URL("../assets/nuevo-foundation-logo.svg", import.meta.url), "utf8");
  assert.match(logo, /viewBox="0 0 940 150"/);
  assert.doesNotMatch(logo, /<script|<foreignObject/);
});

test("hero uses the original flyer mascot rather than a recreated robot", async () => {
  const image = await readFile(new URL("../assets/nuevo-foundation-mascot.jpg", import.meta.url));
  assert.equal(createHash("sha256").update(image).digest("hex"), "1fd94e69293f8bbc2e5978b1e1cb820a11135ee5ee217eca70949d82c9c0bddd");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /class="mascot" src="\.\/assets\/nuevo-foundation-mascot\.jpg" width="508" height="379"/);
  assert.doesNotMatch(html, /robot-screen|robot-antenna|robot-smile/);
});

test("browser code has no value storage, analytics, HTML insertion, or network submission", async () => {
  for (const filename of ["app.js", "email.js", "config.js", "theme.js"]) {
    const source = await readFile(new URL(`../${filename}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie|sendBeacon|fetch\(|XMLHttpRequest|innerHTML|outerHTML|insertAdjacentHTML|eval\(/);
  }
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<form[^>]*hidden[^>]*autocomplete="off"/);
  assert.doesNotMatch(html, /<input[^>]+name=/);
});

test("canonical brand colors provide readable key text combinations", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  for (const [name, value] of Object.entries({ emphasis: "#36374d", cyan: "#00bed5", red: "#e13126", coral: "#e96469", yellow: "#fcb415", blush: "#fbe6e0" })) {
    assert.ok(css.includes(`--nuevo-${name}: ${value};`));
  }
  function color(name) {
    const value = css.match(new RegExp(`--nuevo-${name}: (#[0-9a-f]{6});`))[1];
    return [1, 3, 5].map((start) => parseInt(value.slice(start, start + 2), 16) / 255);
  }
  function luminance(rgb) {
    const linear = rgb.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  }
  for (const [foreground, background, minimum = 4.5] of [
    ["black", "yellow"], ["white", "red", 3], ["emphasis", "white"],
    ["gray-700", "cream"], ["white", "emphasis"], ["gray-100", "emphasis"],
  ]) {
    const values = [luminance(color(foreground)), luminance(color(background))].sort((a, b) => b - a);
    assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= minimum, `${foreground} on ${background} must meet ${minimum}:1 contrast`);
  }
  // White on brand red qualifies for large bold text, but not small text.
  assert.match(css, /\.button-engagement \{[^}]*font-size: 20px;/);
  assert.match(css, /\.button \{[^}]*font-weight: 750;/);
});
