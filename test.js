const loadPikchr = require('./index.js');
const test = require('ava');

const markup = `box`
const expected = `\
<svg xmlns='http://www.w3.org/2000/svg' style='font-size:initial;' class="pikchr" viewBox="0 0 112.32 76.32" data-pikchr-date="20260403102956">
<path d="M2.16,74.16L110.16,74.16L110.16,2.16L2.16,2.16Z"  style="fill:none;stroke-width:2.16;stroke:rgb(0,0,0);" />
</svg>
`

test('simple', async t => {
  const pikchr = await loadPikchr()
  const output = pikchr(markup)
	t.is(output, expected);
});

test('legacy dimension arguments are accepted', async t => {
  const pikchr = await loadPikchr()
  const output = pikchr(markup, "pikchr", 0, 1, 1)
	t.is(output, expected);
});

test('render returns svg dimensions', async t => {
  const pikchr = await loadPikchr()
  const output = pikchr.render(markup)
	t.deepEqual(output, {
    svg: expected,
    width: 112,
    height: 76,
  });
});
