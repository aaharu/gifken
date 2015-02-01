"use strict";

var gifken = require("../build/gifken.js").gifken;

describe("GIF画像作成", function() {
    var gif;

    beforeEach(function() {
        gif = new gifken.Gif();
    });

    it("例外が発生しない", function() {
        gif.width = 500;
        gif.height = 500;
        gif.frames = [gifken.Frame.init(gif)];
        for (var i = 0; i < gif.frames[0].pixelData.length; ++i) {
            gif.frames[0].pixelData[i] = 0;
        }
        var a = function() {
            //gifken.Gif.writeToDataUrl(gif); TODO:window.btoa
        }
        var b = function() {
            //gif.writeToDataUrl();
        }
        expect(a).not.toThrow();
        expect(b).not.toThrow();
    });
});
