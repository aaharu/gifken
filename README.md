# gifken

[![npm version](https://img.shields.io/npm/v/gifken.svg)](https://www.npmjs.com/package/gifken) [![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Faaharu%2Fgifken.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Faaharu%2Fgifken?ref=badge_shield)

## How to use

### Split an animated GIF image in browser

```html
<script type="module">
  import {reverse, split} from 'gifken'

  const imageUrl = '/01_Koch-Kurve-Sechseck-alt._Def.-2.gif'
  const response = await fetch(imageUrl)
  const buffer = await response.arrayBuffer()

  const results = await split(new Uint8Array(buffer))
  for (const result of results) {
    const img = new Image()
    img.src = URL.createObjectURL(new Blob([result], {type: 'image/gif'}))
    document.body.append(img)
  }
</script>
```

### Reverse an animated GIF image with Node.js

```javascript
const {readFileSync, writeFileSync} = require('fs')
const gifken = require('gifken')

gifken
  .reverse(readFileSync('./assets/01_Koch-Kurve-Sechseck-alt._Def.-2.gif'))
  .then(result => {
    writeFileSync('reverse.gif', result)
  })
```

## Build

To build gifken, following tools are required

- Node.js >=14
- npm >=8
- [Cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html)
- wasm-bindgen

```bash
git clone *thisrepo*
cd gifken
npm install
npm run-script build
```

## Similar Projects

- [gif reverser](https://github.com/migerh/rustwasm-gif)

## License

MIT

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Faaharu%2Fgifken.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Faaharu%2Fgifken?ref=badge_large)
