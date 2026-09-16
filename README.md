# Nuevo Foundation Outreach

Reusable outreach materials for schools, families, educators, and community organizations.

## Campaigns

- [School and community engagement](campaigns/school-community-engagement/README.md): combined email and one-page flyer prototype.

## Content Guidelines

- Keep approved messaging and public impact metrics consistent across formats.
- Store recipient details and outreach tracking in an approved CRM or Microsoft List, not in this repository.
- Use fictional recipient information in committed examples.
- Review links, metrics, and contact details before publishing exported assets.

## Parent-to-school email builder

`site/` is a standalone, browser-only website that helps parents start a
conversation with their school about Nuevo Foundation. It does not depend on,
modify, or send messages through the separate email-authoring toolkit.

Parents answer three questions (school name, grade level, and interests), then
edit a suggested subject and message. They can copy the text or explicitly open
their email application, choose a school recipient, and send it themselves.
Program interests are not a booking or a promise of availability.
Grade choices are grades 1-5, grades 6-8, grades 9-12, and multiple grade levels.
The message preview links the word **Form** to the engagement short URL.
It also links **Nuevo Foundation** in "I came across Nuevo Foundation" to
`https://nuevofoundation.org/`.
**Copy message** includes formatted HTML plus a plain-text alternative, so normal
paste into an HTML-capable email composer preserves that hyperlink. Expand
**Edit message text** to change the draft; its editor shows the underlying short
URL. If formatted clipboard access is unavailable, the page explicitly reports
that it copied plain text instead. The **Open my email app** option also uses
plain text: `mailto` cannot preserve a hyperlink behind a word.

### Preview locally

From the repository folder in PowerShell, using Python:

```powershell
py -m http.server 8000 --bind 127.0.0.1 --directory .\site
```

Open `http://127.0.0.1:8000` in your browser. Use Ctrl+C in that terminal to stop
the preview. Serve the site over HTTP rather than double-clicking `index.html`;
browser JavaScript modules need a web server. No package installation or build
step is needed.

Run the focused checks with Node.js 18 or newer:

```powershell
node --test .\site\test\email.test.mjs
```

### Privacy and parent control

- The site has no backend, AI service, analytics, cookies, or browser storage.
  Answers and draft text remain in page memory and are cleared when leaving.
  Inputs omit submission names, and the content security policy blocks network
  connections and form submissions.
- Copying explicitly puts the selected text on the device clipboard. Opening an
  email draft explicitly passes its subject and message to the chosen email app.
  The site cannot confirm whether an app opened or a message was sent.
- A failed clipboard operation selects the text for manual copying. Long email
  links also fall back to copying because email applications have varying limits.
- The separate Microsoft interest form opens only when its link is selected.
  No parent answers are added to that address. The form has its own data handling.
- Engagement buttons open Microsoft Forms directly. The email's shorter link
  uses the personal Pages site's `form.html`, which opens the same Microsoft
  Form and provides a manual fallback. No answers are passed to that page.
- The page does not request children's names. Browser extensions, browser/cloud
  spellchecking settings, operating-system services, and the email application
  remain outside the site's control.

### Flyer and launch configuration

The user-supplied original flyer is preserved at
`site/assets/nuevo-foundation-flyer.png`. Its red engagement button is covered
by an accessible link on both the builder and `site/flyer.html`; a separate,
visible engagement link is also available on the standalone flyer page only. All
engagement buttons use the original Microsoft Forms destination directly.
Email drafts use `https://angelica-salazar-code.github.io/parent-school-outreach/form.html`
as a shorter link to the same form. TinyURL was removed after real browser
navigation began showing its deprecated-API interstitial. `site/config.js`
retains the full destination as `engagementDestinationUrl` for future checks.
The public form metadata confirmed the title "Nuevo Foundation Programs
Interest Form."

The supplied flyer is an image, not an editable PDF. Parents share its hosted
webpage as a link in the email, not as an attachment. Step 3 places **View the
flyer** beside **Open my email app**. The separate image download remains
optional for saving a copy; no download is required to share the flyer.

The verified public flyer address is
`https://angelica-salazar-code.github.io/parent-school-outreach/flyer.html`.
`verifiedFlyerUrl` configures this personal GitHub Pages address. The email
preview and formatted clipboard display **View the flyer** as a hyperlink.
Plain-text copying and `mailto` retain the full public address instead.
An empty configuration still omits the flyer link and explains why rather
than generating a fake or local-only sharing link.

### Comparison with the original campaign

`campaigns/school-community-engagement/preview.html` is the editable HTML
flyer/email prototype. Its sample email's `#flyer-panel` link switches tabs
inside that preview; it is not a standalone link suitable for a recipient's
email. Its engagement action opens a contact email.

`site/flyer.html` hosts the supplied image of that flyer, with a text summary
and a direct Microsoft Forms engagement action. Its full public HTTPS address
works outside the preview and is the address used in parent emails. The
original campaign and its impact wording are not modified by this change.

### Reviewer note: production hosting

Both the parent-outreach website and the flyer should be hosted on Nuevo
Foundation's official website for the eventual production launch. The current
personal GitHub Pages deployment already supplies a working flyer link.
Parent emails share that link, not an attachment. Automatic file attachment
through **Open my email app** is not supported.

Before public launch:

1. Have the outreach owner review the parent email wording and the original
   flyer's claims. New email copy does not repeat its impact metrics.
2. Obtain publishing approval and host both the static `site/` website and the
   flyer on Nuevo Foundation's official website over HTTPS. No deployment
   workflow is configured by this change.
3. Verify that the hosted `flyer.html` page opens without signing in, that its
   image loads, and that its engagement link opens the intended form. The form
   was supplied by the owner. Its title and public metadata have been checked;
   the complete respondent experience still requires review before launch.
4. Set `verifiedFlyerUrl` in `site/config.js` to that verified public flyer-page
   address. Never use a localhost, guessed address, or interest-form URL.
   Incorrect configuration shows an error and prevents draft generation.
5. Re-run the checks and preview on desktop and mobile after changing the
   configured flyer address.

### Design and files

Colors come from the workshops repository's
[`static/css/nuevo-palette.css`](https://github.com/NuevoFoundation/workshops/blob/master/static/css/nuevo-palette.css):
yellow `#fcb415`, red `#e13126`, cyan `#00bed5`, and dark emphasis `#36374d`.
The site's named color variables keep that branding consistent in light and
dark modes. This uses the dedicated palette, not the older explorer's different
amber shade, and does not change the original flyer image or workshops repository.
The unmodified wordmark in `site/assets/nuevo-foundation-logo.svg` also comes from
the workshops repository's
[`static/images/Logo_long.0f097b90.svg`](https://github.com/NuevoFoundation/workshops/blob/master/static/images/Logo_long.0f097b90.svg).
The hero illustration uses the original
[`static/images/NF_mascot.jpg`](https://github.com/NuevoFoundation/workshops/blob/master/static/images/NF_mascot.jpg),
the headphone-wearing robot artwork shown in the supplied flyer, rather than a
redrawn robot. Its colors and proportions are preserved.

| File | Purpose |
| --- | --- |
| `site/index.html` | Three-question form, editable email, and flyer preview |
| `site/flyer.html` | Larger original flyer with a working engagement link |
| `site/form.html` | First-party short link with direct Microsoft Forms redirect and fallback |
| `site/styles.css`, `site/theme.js` | Brand colors, responsive layout, and device theme |
| `site/email.js` | Reviewed-template personalization, validation, copy and email-link helpers |
| `site/app.js` | Browser interactions and protection against overwriting edited drafts |
| `site/config.js` | Engagement destination and future verified public flyer address |
| `site/package.json` | Marks the site's JavaScript as modules for Node; no dependencies |
| `site/test/email.test.mjs` | Dependency-free automated checks |
