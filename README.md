# outreach

Repo dedicated to school and parents outreach.

It holds the emails and newsletters we send to the Nuevo Foundation community,
to partner schools, and to families. Content lives in small JSON files, shared
layout and styling live in HTML templates, and a build step turns the two into
ready-to-send HTML plus a plain-text alternative.

## Requirements

Node.js 18 or newer. There are no third-party dependencies.

## Build the emails

```bash
npm run build                                  # build everything into dist/
npm run build -- 2026-fall-parent-welcome      # build a single email
```

Each email produces `dist/<name>.html` (paste into your email tool) and
`dist/<name>.txt` (the plain-text version). `dist/` is generated and is not
committed.

## Run the checks

```bash
npm test
```

The tests render every email in `content/` and fail if a template placeholder
is left unresolved, if a subject is missing, or if the unsubscribe link is
dropped.

## Repository layout

| Path         | What it holds                                                      |
| ------------ | ------------------------------------------------------------------ |
| `content/`   | One JSON file per email, plus `defaults.json` with shared details.  |
| `templates/` | `layout.html` (header/footer) and one template per email type.      |
| `src/`       | The template renderer and the build script.                         |
| `test/`      | Tests that render every email.                                      |

## Write a new email

1. Copy the closest existing file in `content/` to a new
   `content/<year>-<season>-<topic>.json`.
2. Set `template` to one of the available templates:
   - `newsletter` — community newsletter with stories and upcoming events.
   - `school-outreach` — pitch a program to a school partner.
   - `parent-update` — logistics and reminders for families.
3. Fill in `subject`, `preheader`, and the fields the template uses. Anything
   you leave out is simply omitted from the email.
4. Run `npm run build` and open the generated file in `dist/` to proof it.
5. Run `npm test` and open a pull request so someone can review the copy.

Values shared by every email (organization name, address, reply-to address,
signature) live in `content/defaults.json`, and any email can override them.

## Template syntax

Templates use a small subset of Mustache handled by `src/render.js`:

| Syntax                    | Meaning                                                  |
| ------------------------- | -------------------------------------------------------- |
| `{{ name }}`              | Insert a value, escaped for HTML.                        |
| `{{{ name }}}`            | Insert a value without escaping (only for trusted HTML). |
| `{{# name }}…{{/ name }}` | Repeat for a list, or show once when the value is set.   |
| `{{^ name }}…{{/ name }}` | Show only when the value is missing or empty.            |
| `{{ . }}`                 | The current item inside a list of plain strings.         |

## Sending

The generated HTML keeps the `{{unsubscribe_url}}` merge tag from
`content/defaults.json` so the sending tool can fill it in. Before sending:

- Proof the copy with someone else, and send yourself a test message.
- Check the subject line and preheader in the inbox preview.
- Include the plain-text version from `dist/<name>.txt`.
- Confirm families who asked for Spanish receive the translated version.
