import assert from 'node:assert/strict';
import test from 'node:test';

import { buildEmail, listEmails } from '../src/build.js';
import { htmlToText, render } from '../src/render.js';

test('render substitutes and escapes values', () => {
  assert.equal(render('Hi {{ name }}!', { name: 'Ana & Co' }), 'Hi Ana &amp; Co!');
  assert.equal(render('{{{ name }}}', { name: '<b>Ana</b>' }), '<b>Ana</b>');
  assert.equal(render('[{{ missing }}]', {}), '[]');
  assert.equal(render('{{ a.b }}', { a: { b: 'nested' } }), 'nested');
});

test('render repeats sections for arrays and skips empty ones', () => {
  assert.equal(render('{{# items }}[{{ . }}]{{/ items }}', { items: ['a', 'b'] }), '[a][b]');
  assert.equal(render('{{# items }}x{{/ items }}', { items: [] }), '');
  assert.equal(render('{{^ items }}none{{/ items }}', { items: [] }), 'none');
  assert.equal(
    render('{{# rows }}{{ label }}={{ value }};{{/ rows }}', {
      rows: [
        { label: 'a', value: 1 },
        { label: 'b', value: 2 }
      ]
    }),
    'a=1;b=2;'
  );
});

test('render does not re-process values coming from content', () => {
  const output = render('{{# items }}{{ . }}{{/ items }}{{ tag }}', {
    items: ['{{ tag }}'],
    tag: 'real'
  });
  assert.equal(output, '{{ tag }}real');
});

test('htmlToText keeps links, lists and table labels readable', () => {
  const text = htmlToText(
    '<h1>Title</h1><p>Hello <a href="https://example.org">site</a></p>' +
      '<ul><li>one</li><li>two</li></ul>' +
      '<table><tr><td><strong>Time</strong></td><td>3:30 pm</td></tr></table>'
  );
  assert.match(text, /^Title/);
  assert.match(text, /site \(https:\/\/example\.org\)/);
  assert.match(text, /- one/);
  assert.match(text, /- two/);
  assert.match(text, /Time: 3:30 pm/);
  assert.doesNotMatch(text, /</);
});

test('every email in content/ builds into HTML and plain text', async () => {
  const names = await listEmails();
  assert.ok(names.length > 0, 'expected at least one email in content/');

  for (const name of names) {
    const email = await buildEmail(name);
    assert.ok(email.subject.length > 0, `${name} needs a subject`);
    assert.match(email.html, /^<!doctype html>/i, `${name} should use the shared layout`);
    assert.match(email.html, /Unsubscribe/, `${name} should keep the unsubscribe link`);
    assert.doesNotMatch(
      email.html,
      /\{\{[#^/]/,
      `${name} has an unresolved template section`
    );
    assert.ok(email.text.length > 0, `${name} needs plain text output`);
    assert.doesNotMatch(email.text, /<[a-z]/i, `${name} plain text should not contain HTML`);
  }
});

test('building an email without a template fails loudly', async () => {
  await assert.rejects(() => buildEmail('does-not-exist'), /ENOENT/);
});
