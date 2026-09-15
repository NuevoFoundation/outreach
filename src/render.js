/**
 * Minimal, dependency-free template engine for Nuevo Foundation outreach emails.
 *
 * Supported syntax:
 *   {{ name }}          escaped value lookup (dotted paths supported)
 *   {{{ name }}}        unescaped value lookup
 *   {{# name }}…{{/ name }}   section: repeats for arrays, renders once for truthy values
 *   {{^ name }}…{{/ name }}   inverted section: renders when the value is falsy or empty
 *   {{ . }}             the current item inside a section over an array of strings
 */

const SECTION = /\{\{([#^])\s*([\w.]+)\s*\}\}([\s\S]*?)\{\{\/\s*\2\s*\}\}/;
const VARIABLE = /\{\{(\{)?\s*(\.|[\w.]+)\s*\}?\}\}/g;

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

function lookup(name, stack) {
  if (name === '.') return stack[stack.length - 1];
  const [head, ...rest] = name.split('.');
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const scope = stack[i];
    if (scope !== null && typeof scope === 'object' && head in scope) {
      return rest.reduce(
        (value, key) =>
          value !== null && typeof value === 'object' ? value[key] : undefined,
        scope[head]
      );
    }
  }
  return undefined;
}

function isEmpty(value) {
  return (
    value === undefined ||
    value === null ||
    value === false ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function renderVariables(template, stack) {
  return template.replace(VARIABLE, (_match, raw, name) => {
    const value = lookup(name, stack);
    if (isEmpty(value) && value !== 0) return '';
    return raw ? String(value) : escapeHtml(value);
  });
}

function renderWithStack(template, stack) {
  const section = SECTION.exec(template);
  if (!section) return renderVariables(template, stack);

  const [match, type, name, body] = section;
  const value = lookup(name, stack);
  let replacement = '';

  if (type === '#' && !isEmpty(value)) {
    const items = Array.isArray(value) ? value : [value];
    replacement = items
      .map((item) => renderWithStack(body, [...stack, item]))
      .join('');
  } else if (type === '^' && isEmpty(value)) {
    replacement = renderWithStack(body, stack);
  }

  // Rendered output is never re-scanned, so content values cannot inject tags.
  return (
    renderVariables(template.slice(0, section.index), stack) +
    replacement +
    renderWithStack(template.slice(section.index + match.length), stack)
  );
}

export function render(template, data = {}) {
  return renderWithStack(template, [data]);
}

/**
 * Removes every markup element, repeating until the result no longer changes so
 * that no tag can survive by hiding inside another one.
 */
function stripTags(html) {
  let current = html;
  let previous;
  do {
    previous = current;
    current = current.replace(/<[^<>]*>/g, '');
  } while (current !== previous);
  return current.replace(/<[\s\S]*$/, '');
}

/**
 * Builds the plain-text alternative of an email from its HTML body so both
 * versions always stay in sync.
 */
export function htmlToText(html) {
  return stripTags(
    html
      .replace(/<a\b[^<>]*href="([^"]*)"[^<>]*>([\s\S]*?)<\/a\s*>/gi, (_m, href, text) => {
        const label = stripTags(text).trim();
        return label && label !== href ? `${label} (${href})` : href;
      })
      .replace(/<li\b[^<>]*>/gi, '\n- ')
      .replace(/<\/td>\s*<td\b[^<>]*>/gi, ': ')
      .replace(/<(br|\/p|\/h[1-6]|\/tr|\/div|hr)\b[^<>]*>/gi, '\n')
  )
    .replace(/&nbsp;/gi, ' ')
    .replace(/&mdash;/gi, '\u2014')
    .replace(/&middot;/gi, '\u00b7')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_m, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/gi, '&')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
