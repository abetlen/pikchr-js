const loadPikchr = require('./index.js');
const test = require('ava');

const markup = `box`
const expected = `\
<svg xmlns='http://www.w3.org/2000/svg' class="pikchr" viewBox="0 0 112.32 76.32">
<path d="M2,74L110,74L110,2L2,2Z"  style="fill:none;stroke-width:2.16;stroke:rgb(0,0,0);" />
</svg>
`

test('simple', async t => {
  const pikchr = await loadPikchr()
  const output = pikchr(markup, "pikchr", 0, 1, 1)
	t.is(output, expected);
});

