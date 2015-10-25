"use strict";

var gifken = require("../build/gifken.js"),
    fs = require("fs"),
    path = require("path");

describe("create a GIF image", function() {
    var gif;

    beforeEach(function() {
        gif = new gifken.Gif();
    });

    it("do not throw exceptions", function() {
        gif.width = 100;
        gif.height = 100;
        gif.globalColorTable = gifken.GifColor.createColorTable([
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
        gif.frames = [gifken.GifFrame.init(gif.width, gif.height)];
        for (var i = 0; i < gif.frames[0].pixelData.length; ++i) {
            gif.frames[0].pixelData[i] = i % 11;
        }
        var a = function() {
            var buffer = gif.writeToArray();
            fs.writeFile(path.resolve(__dirname, "sample.gif"), new Buffer(buffer), function (err) {
                if (err) throw err;
            });
        }
        expect(a).not.toThrow();
    });
});
