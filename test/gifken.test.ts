import { Gif, GifColor, GifFrame } from "../src";
import fs from "fs";
import path from "path";

describe("create a GIF image", () => {
  let gif: Gif;

  beforeEach(() => {
    gif = new Gif();
  });

  it("do not throw exceptions", () => {
    gif.width = 100;
    gif.height = 100;
    gif.globalColorTable = GifColor.createColorTable([
      new GifColor(0, 0, 0),
      new GifColor(255, 0, 0),
      new GifColor(0, 255, 0),
      new GifColor(0, 0, 255),
      new GifColor(100, 100, 255),
      new GifColor(100, 255, 100),
      new GifColor(255, 100, 100),
      new GifColor(0, 255, 255),
      new GifColor(255, 0, 255),
      new GifColor(255, 255, 0),
      new GifColor(255, 255, 255)
    ]);
    gif.frames = [GifFrame.init(gif.width, gif.height)];
    for (let i = 0; i < gif.frames[0].pixelData.length; ++i) {
      gif.frames[0].pixelData[i] = i % 11;
    }
    const tmp = (): void => {
      const buffer = gif.writeToArray();
      fs.writeFile(
        path.resolve(__dirname, "sample.gif"),
        Buffer.from(buffer),
        err => {
          if (err) throw err;
        }
      );
    };
    expect(tmp).not.toThrow();
  });
});
