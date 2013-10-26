"use strict";

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
            gifken.Gif.writeToDataUrl(gif);
        }
        expect(a).not.toThrow();
    });
});
