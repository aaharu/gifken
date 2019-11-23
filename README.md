# gifken

[![npm version](https://img.shields.io/npm/v/gifken.svg)](https://www.npmjs.com/package/gifken) [![Build Status](https://img.shields.io/travis/aaharu/gifken.svg)](https://travis-ci.org/aaharu/gifken) [![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Faaharu%2Fgifken.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Faaharu%2Fgifken?ref=badge_shield) [![codecov](https://codecov.io/gh/aaharu/gifken/branch/master/graph/badge.svg)](https://codecov.io/gh/aaharu/gifken)

## How to use

### Create a GIF image in browser

```html
<div id="content"></div>
<script src="https://unpkg.com/gifken@2.0.0/lib/gifken.umd.js"></script>
<script type="application/javascript">
window.onload = () => {
    var newgif = new gifken.Gif();
    newgif.width = 100;
    newgif.height = 100;
    newgif.globalColorTable = gifken.GifColor.createColorTable([
        new gifken.GifColor(0, 0, 0),
        new gifken.GifColor(255, 0, 0),
        new gifken.GifColor(0, 255, 0),
        new gifken.GifColor(0, 0, 255),
        new gifken.GifColor(100, 100, 255),
        new gifken.GifColor(100, 255, 100),
        new gifken.GifColor(255, 100, 100),
        new gifken.GifColor(0, 255, 255),
        new gifken.GifColor(255, 0, 255),
        new gifken.GifColor(255, 255, 0),
        new gifken.GifColor(255, 255, 255)
    ]);
    newgif.frames = [gifken.GifFrame.init(newgif.width, newgif.height)];
    for (var i = 0; i < newgif.frames[0].pixelData.length; ++i) {
        newgif.frames[0].pixelData[i] = i % 11;
    }
    var newimg = new Image();

    // createObjectURL pattern
    // var blob = gifken.GifPresenter.writeToBlob(newgif.writeToArrayBuffer());
    // newimg.src = URL.createObjectURL(blob);

    // data-URL pattern
    newimg.src = gifken.GifPresenter.writeToDataUrl(newgif.writeToArrayBuffer());

    document.getElementById("content").appendChild(newimg);
};
</script>
```

### Split an animated GIF image in browser

```javascript
window.onload = function () {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", GIF_IMAGE_URL, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function (e) {
        var arrayBuffer = e.target["response"];
        var gif = gifken.Gif.parse(arrayBuffer);

        gif.split(true).forEach(function (i) {
            var img = new Image();
            var blob = gifken.Gif.writeToBlob(i.writeToArrayBuffer());
            img.src = URL.createObjectURL(blob);
            document.getElementById("content").appendChild(img);
        });
    };
    xhr.send();
};
```

### Create a GIF image by Node.js

```bash
npm install gifken
```

```javascript
const gifken = require("gifken"),
  fs = require("fs"),
  path = require("path");

const newgif = new gifken.Gif();
newgif.width = 100;
newgif.height = 100;
newgif.globalColorTable = gifken.GifColor.createColorTable([
  new gifken.GifColor(0, 0, 0),
  new gifken.GifColor(255, 0, 0),
  new gifken.GifColor(0, 255, 0),
  new gifken.GifColor(0, 0, 255),
  new gifken.GifColor(100, 100, 255),
  new gifken.GifColor(100, 255, 100),
  new gifken.GifColor(255, 100, 100),
  new gifken.GifColor(0, 255, 255),
  new gifken.GifColor(255, 0, 255),
  new gifken.GifColor(255, 255, 0),
  new gifken.GifColor(255, 255, 255)
]);
newgif.frames = [gifken.GifFrame.init(newgif.width, newgif.height)];
for (let i = 0; i < newgif.frames[0].pixelData.length; ++i) {
  newgif.frames[0].pixelData[i] = i % 11;
}
const buffer = newgif.writeToArray();

fs.writeFile(
  path.resolve(__dirname, "sample.gif"),
  Buffer.from(buffer),
  err => {
    if (err) throw err;
    // eslint-disable-next-line no-console
    console.log("It's saved!");
  }
);
```

- [API Docs](http://aaharu.github.io/gifken/docs/)

## Build

To build gifken, following tools are required

- Node.js >=8.0.0
- npm

```bash
git clone *thisrepo*
cd gifken
npm install
npm run-script build
```

## Similar Projects

* [omggif](https://github.com/deanm/omggif)

## License

MIT

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Faaharu%2Fgifken.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Faaharu%2Fgifken?ref=badge_large)
