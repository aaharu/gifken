const gifken = require("../../lib/gifken"),
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
