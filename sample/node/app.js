/*jshint node: true */

"use strict";

var fs = require("fs"),
    path = require("path"),
    gifken = require("../../build/gifken.js");

var newgif = new gifken.Gif();
newgif.width = 100;
newgif.height = 100;
newgif.globalColorTable = gifken.Color.createColorTable([
    new gifken.Color(0, 0, 0),
    new gifken.Color(255, 0, 0),
    new gifken.Color(0, 255, 0),
    new gifken.Color(0, 0, 255),
    new gifken.Color(100, 100, 255),
    new gifken.Color(100, 255, 100),
    new gifken.Color(255, 100, 100),
    new gifken.Color(0, 255, 255),
    new gifken.Color(255, 0, 255),
    new gifken.Color(255, 255, 0),
    new gifken.Color(255, 255, 255)
]);
newgif.frames = [gifken.Frame.init(newgif.width, newgif.height)];
for (var i = 0; i < newgif.frames[0].pixelData.length; ++i) {
    newgif.frames[0].pixelData[i] = i % 11;
}
var buffer = newgif.writeToArray();

fs.writeFile(path.resolve(__dirname, "sample.gif"), new Buffer(buffer), function (err) {
    if (err) throw err;
    console.log("It's saved!");
});
