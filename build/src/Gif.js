/*
Copyright (c) 2013 aaharu
This software is released under the MIT License.
https://raw.github.com/aaharu/gifken/master/LICENSE

This product includes following softwares:
* jsgif
- Copyright (c) 2011 Shachaf Ben-Kiki
- https://github.com/shachaf/jsgif
- https://raw.github.com/shachaf/jsgif/master/LICENSE
* GifWriter.js
- Copyright (c) 2013 NOBUOKA Yu
- https://github.com/nobuoka/GifWriter.js
- https://raw.github.com/nobuoka/GifWriter.js/master/LICENSE.txt
*/
var gifken;
(function (gifken) {
    var Gif = (function () {
        function Gif(skipDefault) {
            this.frames = [];
            if (skipDefault) {
                return;
            }

            // default values
            this._standard = "GIF89a";
            this._width = 1;
            this._height = 1;
            this.colorResolution = 112;
            this.sortFlag = false;
            this.bgColorIndex = 1;
            this.pixelAspectRatio = 0;
            this.globalColorTable = Color.createColorTable([new Color(0, 0, 0), new Color(255, 255, 255)]);
        }
        Gif.parse = function (buffer) {
            var gif = new Gif(true);
            var data = new DataView(buffer);
            var offset = GifParser.readHeader(gif, data);
            while (true) {
                offset = GifParser.readBlock(gif, data, offset);
                if (offset === -1) {
                    break;
                }
            }
            return gif;
        };

        Object.defineProperty(Gif.prototype, "standard", {
            get: function () {
                return this._standard;
            },
            set: function (std) {
                if (std !== "GIF89a" && std !== "GIF87a") {
                    throw new Error("failed gif format");
                }
                this._standard = std;
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Gif.prototype, "width", {
            get: function () {
                return this._width;
            },
            set: function (width) {
                width = ~~width;
                if (width > 0xffff || width < 0) {
                    throw new RangeError("width range error: " + width);
                }
                this._width = width;
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Gif.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (height) {
                height = ~~height;
                if (height > 0xffff || height < 0) {
                    throw new RangeError("height range error: " + height);
                }
                this._height = height;
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Gif.prototype, "globalColorTable", {
            set: function (bytes) {
                this._globalColorTable = bytes;
                this._globalTableSize = bytes.byteLength / 3;
                if (this.bgColorIndex === undefined) {
                    this.bgColorIndex = this._globalTableSize - 1;
                }
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Gif.prototype, "globalTableSize", {
            get: function () {
                return this._globalTableSize;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Gif.prototype, "loopCount", {
            get: function () {
                return this._loopCount;
            },
            set: function (loopCount) {
                loopCount = ~~loopCount;
                if (loopCount > 0xffff || loopCount < 0) {
                    throw new RangeError("loopCount range error: " + loopCount);
                }
                this._loopCount = loopCount;
            },
            enumerable: true,
            configurable: true
        });


        Gif.prototype.writeToBlob = function () {
            var output = [];

            // write header
            var header = new DataView(new ArrayBuffer(13));
            header.setUint8(0, 71);
            header.setUint8(1, 73);
            header.setUint8(2, 70);
            header.setUint8(3, 56);
            if (this._standard === "GIF89a") {
                header.setUint8(4, 57);
            } else {
                header.setUint8(4, 55);
            }
            header.setUint8(5, 97);
            header.setUint16(6, this._width, true);
            header.setUint16(8, this._height, true);
            var packed = 0;
            if (this._globalTableSize > 0) {
                packed |= 128;
                var count = 0;
                var size = this._globalTableSize;
                do {
                    size = size >> 1;
                    ++count;
                } while(size > 1);
                packed |= count - 1;
            }
            packed |= this.colorResolution;
            if (this.sortFlag) {
                packed |= 8;
            }
            header.setUint8(10, packed);
            header.setUint8(11, this.bgColorIndex);
            header.setUint8(12, this.pixelAspectRatio);
            output.push(header);
            if (this._globalTableSize > 0) {
                output.push(this._globalColorTable);
            }

            if (this.isLoop) {
                var appExt = new DataView(new ArrayBuffer(19));
                appExt.setUint8(0, 0x21);
                appExt.setUint8(1, 0xff);
                appExt.setUint8(2, 0x0b);
                appExt.setUint8(3, 0x4e);
                appExt.setUint8(4, 0x45);
                appExt.setUint8(5, 0x54);
                appExt.setUint8(6, 0x53);
                appExt.setUint8(7, 0x43);
                appExt.setUint8(8, 0x41);
                appExt.setUint8(9, 0x50);
                appExt.setUint8(10, 0x45);
                appExt.setUint8(11, 0x32);
                appExt.setUint8(12, 0x2e);
                appExt.setUint8(13, 0x30);
                appExt.setUint8(14, 3);
                appExt.setUint8(15, 1);
                appExt.setUint16(16, this._loopCount, true);
                appExt.setUint8(18, 0);
                output.push(appExt);
            }

            // write image data
            this.frames.forEach(function (frame) {
                var image = new DataView(new ArrayBuffer(18));
                image.setUint8(0, 0x21);
                image.setUint8(1, 0xf9);
                image.setUint8(2, 0x04);
                if (frame.transparentFlag) {
                    image.setUint8(3, 1);
                } else {
                    image.setUint8(3, 0);
                }
                image.setUint16(4, frame.delayCentiSeconds, true);
                image.setUint8(6, frame.transparentColorIndex);
                image.setUint8(7, 0);

                image.setUint8(8, 0x2c);
                image.setUint16(9, frame.x, true);
                image.setUint16(11, frame.y, true);
                image.setUint16(13, frame.width, true);
                image.setUint16(15, frame.height, true);
                if (frame.localTableSize > 0) {
                    var count = 0;
                    var size = frame.localTableSize;
                    do {
                        size = size >> 1;
                        ++count;
                    } while(size > 1);
                    image.setUint8(17, 128 | (count - 1));
                } else {
                    image.setUint8(17, 0);
                }
                output.push(image);
                if (frame.localTableSize > 0) {
                    output.push(frame.localColorTable);
                }
                output.push(new Uint8Array([frame.lzwCode]));
                if (frame.compressedData === undefined && frame.pixelData === undefined) {
                    throw new Error("no image data");
                }
                var idx = 0, compressedBytes = frame.compressedData;
                compressedBytes = compressedBytes || new Uint8Array(compressWithLZW(frame.pixelData, frame.lzwCode));
                var l = compressedBytes.length;
                while (true) {
                    if (l > idx + 255) {
                        output.push(new Uint8Array([255]));
                        output.push(compressedBytes.subarray(idx, idx + 255));
                        idx += 255;
                        continue;
                    }
                    var bytes = compressedBytes.subarray(idx);
                    output.push(new Uint8Array([bytes.byteLength]));
                    output.push(bytes);
                    break;
                }
                output.push(new Uint8Array([0]));
            });

            output.push(new Uint8Array([0x3b]));
            return new Blob(output, { "type": "image\/gif" });
        };

        Gif.prototype.split = function (orverwrite) {
            var _this = this;
            var res = [];
            if (orverwrite) {
                this.frames.forEach(function (frame, index) {
                    var gif = new Gif();
                    gif.standard = _this._standard;
                    gif.width = _this._width;
                    gif.height = _this._height;
                    gif.colorResolution = _this.colorResolution;
                    gif.sortFlag = _this.sortFlag;
                    gif.bgColorIndex = _this.bgColorIndex;
                    gif.pixelAspectRatio = _this.pixelAspectRatio;
                    gif.globalColorTable = _this._globalColorTable;
                    if (index !== 0 && frame.transparentFlag) {
                        if (frame.pixelData === undefined) {
                            frame.decompress();
                        }
                        if (_this.frames[index - 1].pixelData === undefined) {
                            _this.frames[index - 1].decompress();
                        }
                        for (var i = 0, l = frame.pixelData.length; i < l; ++i) {
                            if (frame.pixelData[i] === frame.transparentColorIndex) {
                                frame.pixelData[i] = _this.frames[index - 1].pixelData[i];
                            }
                        }
                        var compressedBytes = compressWithLZW(frame.pixelData, frame.lzwCode);
                        frame.compressedData = new Uint8Array(compressedBytes);
                    }
                    gif.frames = [frame];
                    res.push(gif);
                });
            } else {
                this.frames.forEach(function (frame) {
                    var gif = new Gif();
                    gif.standard = _this._standard;
                    gif.width = _this._width;
                    gif.height = _this._height;
                    gif.colorResolution = _this.colorResolution;
                    gif.sortFlag = _this.sortFlag;
                    gif.bgColorIndex = _this.bgColorIndex;
                    gif.pixelAspectRatio = _this.pixelAspectRatio;
                    gif.globalColorTable = _this._globalColorTable;
                    gif.frames = [frame];
                    res.push(gif);
                });
            }
            return res;
        };

        Gif.prototype.playback = function (overwrite) {
            var _this = this;
            var res = new Gif();
            if (overwrite) {
                this.frames.forEach(function (frame, index) {
                    if (index !== 0 && frame.transparentFlag) {
                        if (frame.pixelData === undefined) {
                            frame.decompress();
                        }
                        if (_this.frames[index - 1].pixelData === undefined) {
                            _this.frames[index - 1].decompress();
                        }
                        for (var i = 0, l = frame.pixelData.length; i < l; ++i) {
                            if (frame.pixelData[i] === frame.transparentColorIndex) {
                                frame.pixelData[i] = _this.frames[index - 1].pixelData[i];
                            }
                        }
                        var compressedBytes = compressWithLZW(frame.pixelData, frame.lzwCode);
                        frame.compressedData = new Uint8Array(compressedBytes);
                    }
                });
            }
            res.standard = this._standard;
            res.width = this._width;
            res.height = this._height;
            res.colorResolution = this.colorResolution;
            res.sortFlag = this.sortFlag;
            res.bgColorIndex = this.bgColorIndex;
            res.pixelAspectRatio = this.pixelAspectRatio;
            res.globalColorTable = this._globalColorTable;
            res.frames = this.frames.reverse();
            res.isLoop = this.isLoop;
            res.loopCount = this._loopCount;
            return res;
        };
        return Gif;
    })();
    gifken.Gif = Gif;

    var Frame = (function () {
        function Frame(gif) {
            this._parent = gif;
        }
        Frame.init = function (gif) {
            var frame = new Frame(gif);
            frame.transparentFlag = false;
            frame.delayCentiSeconds = 0;
            frame.transparentColorIndex = 0;
            frame.x = 0;
            frame.y = 0;
            frame.width = gif.width || 1;
            frame.height = gif.height || 1;
            frame.localTableSize = 0;
            frame.lzwCode = 4;
            frame.pixelData = new Uint8Array(frame.width * frame.height);
            return frame;
        };

        Frame.prototype.decompress = function () {
            this.pixelData = lzwDecode(this.lzwCode, this.compressedData, this.width * this.height);
        };
        return Frame;
    })();
    gifken.Frame = Frame;

    var Color = (function () {
        function Color(r, g, b) {
            this.r = r;
            this.g = g;
            this.b = b;
        }
        Color.valueOf = function (color) {
            // TODO
        };

        Color.createColorTable = function (colors) {
            var numbers = [];
            for (var i = 1; i <= 8; ++i) {
                var d = (i << 1) - colors.length;
                for (var j = 0; j < d; ++j) {
                    colors.push(new Color(255, 255, 255));
                }
            }
            colors.forEach(function (color) {
                numbers.push(color.r);
                numbers.push(color.g);
                numbers.push(color.b);
            });
            return new Uint8Array(numbers);
        };
        return Color;
    })();
    gifken.Color = Color;

    var GifParser = (function () {
        function GifParser() {
        }
        GifParser.readHeader = function (gif, data) {
            gif.standard = String.fromCharCode(data.getUint8(0), data.getUint8(1), data.getUint8(2), data.getUint8(3), data.getUint8(4), data.getUint8(5));
            gif.width = data.getUint16(6, true);
            gif.height = data.getUint16(8, true);
            var packed = data.getUint8(10);
            var tableFlag = packed & 128;
            var tableSize;
            if (tableFlag !== 128) {
                tableSize = 0;
            } else {
                tableSize = 1 << ((packed & 7) + 1);
            }
            gif.colorResolution = packed & 112;
            gif.sortFlag = (packed & 8) === 8 ? true : false;
            gif.bgColorIndex = data.getUint8(11);
            gif.pixelAspectRatio = data.getUint8(12);
            if (tableFlag !== 128) {
                return 13;
            }
            gif.globalColorTable = new Uint8Array(data.buffer, 13, 3 * tableSize);
            return 13 + 3 * tableSize;
        };

        GifParser.readBlock = function (gif, data, offset) {
            var separator = data.getUint8(offset);
            if (separator === 0x3b) {
                return -1;
            }
            if (separator === 0x21) {
                // Extension block
                var label = data.getUint8(offset + 1);
                if (label === 0xf9) {
                    var frame = new Frame(gif);
                    offset = this.readGraphicControlExtensionBlock(gif, data, offset, frame);
                    offset = this.readImageBlock(gif, data, offset, frame);
                    gif.frames.push(frame);
                    return offset;
                }
                if (label === 0xfe) {
                    offset = this.readCommentExtensionBlock(gif, data, offset);
                    return offset;
                }
                if (label === 0xff) {
                    offset = this.readApplicationExtensionBlock(gif, data, offset);
                    return offset;
                }
                if (label === 0x01) {
                    offset = this.readPlainTextExtensionBlock(gif, data, offset);
                    return offset;
                }
            }
            if (separator === 0x2c) {
                var frame = new Frame(gif);
                offset = this.readImageBlock(gif, data, offset, frame);
                gif.frames.push(frame);
                return offset;
            }

            return -1;
        };

        GifParser.readImageBlock = function (gif, data, offset, frame) {
            frame.x = data.getUint16(++offset, true);
            offset += 2;
            frame.y = data.getUint16(offset, true);
            offset += 2;
            frame.width = data.getUint16(offset, true);
            offset += 2;
            frame.height = data.getUint16(offset, true);
            offset += 2;
            var packed = data.getUint8(offset++);
            var tableFlag = packed & 128;
            if (tableFlag === 128) {
                frame.localTableSize = 1 << ((packed & 7) + 1);
                frame.localColorTable = new Uint8Array(data.buffer, offset, 3 * frame.localTableSize);
                offset += 3 * frame.localTableSize;
            } else {
                frame.localTableSize = 0;
            }
            frame.lzwCode = data.getUint8(offset++);
            var dataList = new Array();
            var totalSize = 0;
            while (true) {
                var blockSize = data.getUint8(offset++);
                totalSize += blockSize;
                if (blockSize === 0) {
                    break;
                }
                dataList.push(new Uint8Array((data.buffer).slice(offset, offset + blockSize)));
                offset += blockSize;
            }
            var bytes = new Uint8Array(totalSize);
            bytes.set(dataList[0], 0);
            var len = dataList[0].byteLength;
            for (var i = 1, l = dataList.length; i < l; ++i) {
                bytes.set(dataList[i], len);
                len += dataList[i].byteLength;
            }
            frame.compressedData = bytes;
            return offset;
        };

        GifParser.readApplicationExtensionBlock = function (gif, data, offset) {
            offset += 2;
            if (data.getUint8(offset++) !== 0x0b) {
                throw new Error("faild: _readApplicationExtensionBlock");
            }
            var app = String.fromCharCode(data.getUint8(offset++), data.getUint8(offset++), data.getUint8(offset++), data.getUint8(offset++), data.getUint8(offset++), data.getUint8(offset++), data.getUint8(offset++), data.getUint8(offset++), data.getUint8(offset++), data.getUint8(offset++), data.getUint8(offset++));
            if (app === "NETSCAPE2.0") {
                gif.isLoop = true;
                if (data.getUint8(offset++) !== 3) {
                    throw new Error("faild: _readApplicationExtensionBlock (NETSCAPE2.0)");
                }
                ++offset;
                gif.loopCount = data.getUint16(offset, true);
                offset += 2;
            }
            while (true) {
                var blockSize = data.getUint8(offset++);
                if (blockSize === 0) {
                    break;
                }
                offset += blockSize;
            }
            return offset;
        };

        GifParser.readCommentExtensionBlock = function (gif, data, offset) {
            // skip
            offset += 2;
            while (true) {
                var blockSize = data.getUint8(offset++);
                if (blockSize === 0) {
                    break;
                }
                offset += blockSize;
            }
            return offset;
        };

        GifParser.readGraphicControlExtensionBlock = function (gif, data, offset, frame) {
            var packed = data.getUint8(offset + 3);
            frame.transparentFlag = (packed & 1) === 1;
            frame.delayCentiSeconds = data.getUint16(offset + 4, true);
            frame.transparentColorIndex = data.getUint8(offset + 6);
            return offset + 8;
        };

        GifParser.readPlainTextExtensionBlock = function (gif, data, offset) {
            // skip
            offset += 2;
            while (true) {
                var blockSize = data.getUint8(offset++);
                if (blockSize === 0) {
                    break;
                }
                offset += blockSize;
            }
            return offset;
        };
        return GifParser;
    })();

    /*
    ===begin jsgif===
    */
    var lzwDecode = function (minCodeSize, data, len) {
        var pos = 0;

        var readCode = function (size) {
            var code = 0;
            for (var i = 0; i < size; ++i) {
                if (data[pos >> 3] & (1 << (pos & 7))) {
                    code |= 1 << i;
                }
                ++pos;
            }
            return code;
        };

        var output = new Uint8Array(len);

        var clearCode = 1 << minCodeSize;
        var eoiCode = clearCode + 1;

        var codeSize = minCodeSize + 1;

        var dict = [];

        var clear = function () {
            dict = [];
            codeSize = minCodeSize + 1;
            for (var i = 0; i < clearCode; ++i) {
                dict[i] = [i];
            }
            dict[clearCode] = [];
            dict[eoiCode] = null;
        };

        var code;
        var last;
        var offset = 0;

        while (true) {
            last = code;
            code = readCode(codeSize);

            if (code === clearCode) {
                clear();
                continue;
            }
            if (code === eoiCode)
                break;

            if (code < dict.length) {
                if (last !== clearCode) {
                    dict.push(dict[last].concat(dict[code][0]));
                }
            } else {
                if (code !== dict.length)
                    throw new Error('Invalid LZW code.');
                dict.push(dict[last].concat(dict[last][0]));
            }
            output.set(dict[code], offset);
            offset += dict[code].length;

            if (dict.length === (1 << codeSize) && codeSize < 12) {
                // If we're at the last code and codeSize is 12, the next code will be a clearCode, and it'll be 12 bits long.
                codeSize++;
            }
        }

        return output;
    };

    /*
    ===end jsgif===
    */
    /*
    ===begin GifWriter.js===
    */
    var GifCompressedCodesToByteArrayConverter = (function () {
        function GifCompressedCodesToByteArrayConverter() {
            this.__out = [];
            this.__remNumBits = 0;
            this.__remVal = 0;
        }
        GifCompressedCodesToByteArrayConverter.prototype.push = function (code, numBits) {
            while (numBits > 0) {
                this.__remVal = ((code << this.__remNumBits) & 0xFF) + this.__remVal;
                if (numBits + this.__remNumBits >= 8) {
                    this.__out.push(this.__remVal);
                    numBits = numBits - (8 - this.__remNumBits);
                    code = (code >> (8 - this.__remNumBits));
                    this.__remVal = 0;
                    this.__remNumBits = 0;
                } else {
                    this.__remNumBits = numBits + this.__remNumBits;
                    numBits = 0;
                }
            }
        };
        GifCompressedCodesToByteArrayConverter.prototype.flush = function () {
            this.push(0, 8);
            this.__remNumBits = 0;
            this.__remVal = 0;
            var out = this.__out;
            this.__out = [];
            return out;
        };
        return GifCompressedCodesToByteArrayConverter;
    })();

    function compressWithLZW(actualCodes, numBits) {
        // `numBits` is LZW-initial code size, which indicates how many bits are needed
        // to represents actual code.
        var bb = new GifCompressedCodesToByteArrayConverter();

        // GIF spec says: A special Clear code is defined which resets all
        // compression/decompression parameters and tables to a start-up state.
        // The value of this code is 2**<code size>. For example if the code size
        // indicated was 4 (image was 4 bits/pixel) the Clear code value would be 16
        // (10000 binary). The Clear code can appear at any point in the image data
        // stream and therefore requires the LZW algorithm to process succeeding
        // codes as if a new data stream was starting. Encoders should
        // output a Clear code as the first code of each image data stream.
        var clearCode = (1 << numBits);

        // GIF spec says: An End of Information code is defined that explicitly
        // indicates the end of the image data stream. LZW processing terminates
        // when this code is encountered. It must be the last code output by the
        // encoder for an image. The value of this code is <Clear code>+1.
        var endOfInfoCode = clearCode + 1;

        var nextCode;
        var curNumCodeBits;
        var dict;
        function resetAllParamsAndTablesToStartUpState() {
            // GIF spec says: The first available compression code value is <Clear code>+2.
            nextCode = endOfInfoCode + 1;
            curNumCodeBits = numBits + 1;
            dict = Object.create(null);
        }
        resetAllParamsAndTablesToStartUpState();
        bb.push(clearCode, curNumCodeBits);

        var concatedCodesKey = "";
        for (var i = 0, len = actualCodes.length; i < len; ++i) {
            var code = actualCodes[i];
            var dictKey = String.fromCharCode(code);
            if (!(dictKey in dict))
                dict[dictKey] = code;

            var oldKey = concatedCodesKey;
            concatedCodesKey += dictKey;
            if (!(concatedCodesKey in dict)) {
                bb.push(dict[oldKey], curNumCodeBits);

                if (nextCode <= 0xFFF) {
                    dict[concatedCodesKey] = nextCode;
                    if (nextCode === (1 << curNumCodeBits))
                        curNumCodeBits++;
                    nextCode++;
                } else {
                    bb.push(clearCode, curNumCodeBits);
                    resetAllParamsAndTablesToStartUpState();
                    dict[dictKey] = code;
                }
                concatedCodesKey = dictKey;
            }
        }
        bb.push(dict[concatedCodesKey], curNumCodeBits);
        bb.push(endOfInfoCode, curNumCodeBits);
        return bb.flush();
    }
})(gifken || (gifken = {}));
