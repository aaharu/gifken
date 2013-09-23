/*
The MIT License (MIT)

Copyright (c) 2013 aaharu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */
module gifken {
    export class Gif {
        public standard: string;
        public width: number;
        public height: number;
        public globalTableSize: number;
        public colorResolution: number;
        public sortFlag: boolean;
        public bgColorIndex: number;
        public pixelRatio: number;
        public globalColorTable: Uint8Array;
        public frames: Frame[];
        public isLoop: boolean;
        public loopCount: number;

        constructor() {
            this.frames = [];
        }

        public writeToBlob(): Blob {
            var output: ArrayBufferView[] = [];

            // write header
            var header = new DataView(new ArrayBuffer(13));
            header.setUint8(0, 71);
            header.setUint8(1, 73);
            header.setUint8(2, 70);
            header.setUint8(3, 56);
            if (this.standard === "GIF89a") {
                header.setUint8(4, 57);
            } else {
                header.setUint8(4, 55);
            }
            header.setUint8(5, 97);
            header.setUint16(6, this.width, true);
            header.setUint16(8, this.height, true);
            var packed = 0;
            if (this.globalTableSize > 0) {
                packed |= 128;
                var count = 0;
                var size = this.globalTableSize;
                do {
                    size = size >> 1;
                    ++count;
                } while (size > 1);
                packed |= count - 1;
            }
            packed |= this.colorResolution;
            if (this.sortFlag) {
                packed |= 8;
            }
            header.setUint8(10, packed);
            header.setUint8(11, this.bgColorIndex);
            header.setUint8(12, this.pixelRatio);
            output.push(header);
            if (this.globalTableSize > 0) {
                output.push(this.globalColorTable);
            }

            // write extention
            if (this.isLoop) {
                var appExt = new DataView(new ArrayBuffer(19));
                appExt.setUint8(0, 0x21);
                appExt.setUint8(1, 0xff);
                appExt.setUint8(2, 0x0b);
                appExt.setUint8(3, 0x4e); // N
                appExt.setUint8(4, 0x45); // E
                appExt.setUint8(5, 0x54); // T
                appExt.setUint8(6, 0x53); // S
                appExt.setUint8(7, 0x43); // C
                appExt.setUint8(8, 0x41); // A
                appExt.setUint8(9, 0x50); // P
                appExt.setUint8(10, 0x45); // E
                appExt.setUint8(11, 0x32); // 2
                appExt.setUint8(12, 0x2e); // .
                appExt.setUint8(13, 0x30); // 0
                appExt.setUint8(14, 3);
                appExt.setUint8(15, 1);
                appExt.setUint16(16, this.loopCount, true);
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
                    } while (size > 1);
                    image.setUint8(17, 128 | (count - 1));
                } else {
                    image.setUint8(17, 0);
                }
                output.push(image);
                if (frame.localTableSize > 0) {
                    output.push(frame.localColorTable);
                }
                output.push(new Uint8Array([frame.lzwCode]));
                frame.dataList.forEach(function (data) {
                    output.push(new Uint8Array([data.byteLength]));
                    output.push(data);
                });
                output.push(new Uint8Array([0]));
            });

            output.push(new Uint8Array([0x3b])); // trailer
            return new Blob(output, { "type": "image\/gif" });
        }

        public parse(buffer: ArrayBuffer) {
            var data = new DataView(buffer);
            var offset = this._readHeader(data);
            while (true) {
                offset = this._readBlock(data, offset);
                if (offset === -1) {
                    break;
                }
            }
        }

        public split(orverwrite: boolean): Gif[] {
            var res: Gif[] = [];
            if (orverwrite) {
                this.frames.forEach(function (frame, index) {
                    var gif = new Gif();
                    gif.standard = this.standard;
                    gif.width = this.width;
                    gif.height = this.height;
                    gif.globalTableSize = this.globalTableSize;
                    gif.colorResolution = this.colorResolution;
                    gif.sortFlag = this.sortFlag;
                    gif.bgColorIndex = this.bgColorIndex;
                    gif.pixelRatio = this.pixelRatio;
                    gif.globalColorTable = this.globalColorTable;
                    frame.readData();
                    if (index !== 0 && frame.transparentFlag) {
                        for (var i = 0, l = frame.pixelData.length; i < l; ++i) {
                            if (frame.pixelData[i] === frame.transparentColorIndex) {
                                frame.pixelData[i] = this.frames[index - 1].pixelData[i];
                            }
                        }
                        var compressedBytes = compressWithLZW(frame.pixelData, frame.lzwCode);
                        var dataList = new Array<Uint8Array>();
                        var idx = 0;
                        while (true) {
                            if (compressedBytes.length > idx + 255) {
                                dataList.push(new Uint8Array(compressedBytes.slice(idx, idx + 255)));
                                idx += 255;
                                continue;
                            }
                            dataList.push(new Uint8Array(compressedBytes.slice(idx)));
                            break;
                        }
                        frame.dataList = dataList;
                    }
                    gif.frames = [frame];
                    res.push(gif);
                }, this);
            } else {
                this.frames.forEach(function (frame) {
                    var gif = new Gif();
                    gif.standard = this.standard;
                    gif.width = this.width;
                    gif.height = this.height;
                    gif.globalTableSize = this.globalTableSize;
                    gif.colorResolution = this.colorResolution;
                    gif.sortFlag = this.sortFlag;
                    gif.bgColorIndex = this.bgColorIndex;
                    gif.pixelRatio = this.pixelRatio;
                    gif.globalColorTable = this.globalColorTable;
                    gif.frames = [frame];
                    res.push(gif);
                }, this);
            }
            return res;
        }

        public playback(overwrite: boolean): Gif {
            var res: Gif = new Gif();
            if (overwrite) {
                this.frames.forEach(function (frame, index) {
                    frame.readData();
                    if (index !== 0 && frame.transparentFlag) {
                        for (var i = 0, l = frame.pixelData.length; i < l; ++i) {
                            if (frame.pixelData[i] === frame.transparentColorIndex) {
                                frame.pixelData[i] = this.frames[index - 1].pixelData[i];
                            }
                        }
                        var compressedBytes = compressWithLZW(frame.pixelData, frame.lzwCode);
                        var dataList = new Array<Uint8Array>();
                        var idx = 0;
                        while (true) {
                            if (compressedBytes.length > idx + 255) {
                                dataList.push(new Uint8Array(compressedBytes.slice(idx, idx + 255)));
                                idx += 255;
                                continue;
                            }
                            dataList.push(new Uint8Array(compressedBytes.slice(idx)));
                            break;
                        }
                        frame.dataList = dataList;
                    }
                }, this);
            }
            res.standard = this.standard;
            res.width = this.width;
            res.height = this.height;
            res.globalTableSize = this.globalTableSize;
            res.colorResolution = this.colorResolution;
            res.sortFlag = this.sortFlag;
            res.bgColorIndex = this.bgColorIndex;
            res.pixelRatio = this.pixelRatio;
            res.globalColorTable = this.globalColorTable;
            res.frames = this.frames.reverse();
            res.isLoop = this.isLoop;
            res.loopCount = this.loopCount;
            return res;
        }

        private _readHeader(data: DataView): number {
            this.standard = String.fromCharCode(data.getInt8(0), data.getInt8(1), data.getInt8(2), data.getInt8(3), data.getInt8(4), data.getInt8(5));
            if (this.standard !== "GIF89a" && this.standard !== "GIF87a") {
                throw new Error("gif format error");
            }
            this.width = data.getUint16(6, true);
            this.height = data.getUint16(8, true);
            var packed = data.getUint8(10); // Global Color Table Flag(1 bit) Color Resolution(3 bits) Sort Flag(1 bit) Size of Global Color Table(3 bits)
            var tableFlag = packed & 128;
            if (tableFlag !== 128) {
                this.globalTableSize = 0;
            } else {
                this.globalTableSize = 1 << ((packed & 7) + 1);
            }
            this.colorResolution = packed & 112;
            this.sortFlag = (packed & 8) === 8 ? true : false;
            this.bgColorIndex = data.getUint8(11);
            this.pixelRatio = data.getUint8(12);
            if (tableFlag !== 128) {
                return 13;
            }
            this.globalColorTable = new Uint8Array(data.buffer, 13, 3 * this.globalTableSize);
            return 13 + 3 * this.globalTableSize;
        }

        private _readBlock(data: DataView, offset: number): number {
            var separator = data.getUint8(offset);
            if (separator === 0x3b) {
                return -1;
            }
            if (separator === 0x21) {
                // Extension block
                var label = data.getUint8(offset + 1);
                if (label === 0xf9) {
                    var frame = new Frame();
                    frame.start = offset;
                    offset = this._readGraphicControlExtensionBlock(data, offset, frame);
                    offset = this._readImageBlock(data, offset, frame);
                    frame.end = offset;
                    this.frames.push(frame);
                    return offset;
                }
                if (label === 0xfe) {
                    offset = this._readCommentExtensionBlock(data, offset);
                    return offset;
                }
                if (label === 0xff) {
                    offset = this._readApplicationExtensionBlock(data, offset);
                    return offset;
                }
                if (label === 0x01) {
                    offset = this._readPlainTextExtensionBlock(data, offset);
                    return offset;
                }
            }
            if (separator === 0x2c) {
                var frame = new Frame();
                frame.start = offset;
                offset = this._readImageBlock(data, offset, frame);
                frame.end = offset;
                this.frames.push(frame);
                return offset;
            }

            return -1;
        }

        private _readImageBlock(data: DataView, offset: number, frame: Frame): number {
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
            var dataList = new Array<Uint8Array>();
            while (true) {
                var blockSize = data.getUint8(offset++);
                if (blockSize === 0) {
                    break;
                }
                dataList.push(new Uint8Array((<any>data.buffer).slice(offset, offset + blockSize)));
                offset += blockSize;
            }
            frame.dataList = dataList;
            return offset;
        }

        private _readApplicationExtensionBlock(data: DataView, offset: number): number {
            offset += 2;
            if (data.getUint8(offset++) !== 0x0b) {
                throw new Error("faild: _readApplicationExtensionBlock");
            }
            var app = String.fromCharCode(data.getInt8(offset++), data.getInt8(offset++), data.getInt8(offset++), data.getInt8(offset++), data.getInt8(offset++), data.getInt8(offset++), data.getInt8(offset++), data.getInt8(offset++), data.getInt8(offset++), data.getInt8(offset++), data.getInt8(offset++));
            if (app === "NETSCAPE2.0") {
                this.isLoop = true;
                if (data.getUint8(offset++) !== 3) {
                    throw new Error("faild: _readApplicationExtensionBlock (NETSCAPE2.0)");
                }
                ++offset;
                this.loopCount = data.getUint16(offset, true);
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
        }

        private _readCommentExtensionBlock(data: DataView, offset: number): number {
            offset += 2;
            while (true) {
                var blockSize = data.getUint8(offset++);
                if (blockSize === 0) {
                    break;
                }
                offset += blockSize;
            }
            return offset;
        }

        private _readGraphicControlExtensionBlock(data: DataView, offset: number, frame: Frame): number {
            var packed = data.getUint8(offset + 3);
            frame.transparentFlag = (packed & 1) === 1;
            frame.delayCentiSeconds = data.getUint16(offset + 4, true);
            frame.transparentColorIndex = data.getUint8(offset + 6);
            return offset + 8;
        }

        private _readPlainTextExtensionBlock(data: DataView, offset: number): number {
            offset += 2;
            while (true) {
                var blockSize = data.getUint8(offset++);
                if (blockSize === 0) {
                    break;
                }
                offset += blockSize;
            }
            return offset;
        }
    }

    export class Frame {
        public start: number;
        public end: number;
        public transparentFlag: boolean;
        public delayCentiSeconds: number;
        public transparentColorIndex: number;
        public x: number;
        public y: number;
        public width: number;
        public height: number;
        public localTableSize: number;
        public lzwCode: number;
        public localColorTable: Uint8Array;
        public dataList: Uint8Array[];
        public pixelData: Uint8Array;

        constructor() {
        }

        public readData() {
            var len = 0;
            for (var i = 0, l = this.dataList.length; i < l; ++i) {
                len += this.dataList[i].byteLength;
            }
            var data = new Uint8Array(len);
            data.set(this.dataList[0], 0);
            len = this.dataList[0].byteLength;
            for (i = 1; i < l; ++i) {
                data.set(this.dataList[i], len);
                len += this.dataList[i].byteLength;
            }
            var res = lzwDecode(this.lzwCode, data, this.width * this.height);
            this.pixelData = res;
        }
    }

    /*
    ===begin jsgif===
    "lzwDecode" is using open source software:
    jsgif
    https://github.com/shachaf/jsgif

Copyright (c) 2011 Shachaf Ben-Kiki

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    */
    var lzwDecode = function (minCodeSize: number, data: Uint8Array, len: number):Uint8Array {
        var pos = 0; // Maybe this streaming thing should be merged with the Stream?

        var readCode = function (size):number {
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
            if (code === eoiCode) break;

            if (code < dict.length) {
                if (last !== clearCode) {
                    dict.push(dict[last].concat(dict[code][0]));
                }
            } else {
                if (code !== dict.length) throw new Error('Invalid LZW code.');
                dict.push(dict[last].concat(dict[last][0]));
            }
            output.set(dict[code], offset);
            offset += dict[code].length;

            if (dict.length === (1 << codeSize) && codeSize < 12) {
                // If we're at the last code and codeSize is 12, the next code will be a clearCode, and it'll be 12 bits long.
                codeSize++;
            }
        }

        // I don't know if this is technically an error, but some GIFs do it.
        //if (Math.ceil(pos / 8) !== data.length) throw new Error('Extraneous LZW bytes.');
        return output;
    };
    /*
    ===end jsgif===
    */

    /*
    ===begin GifWriter.js===
    "compressWithLZW" is using open source software:
    GifWriter.js
    https://github.com/nobuoka/GifWriter.js

The MIT License (MIT)

Copyright (c) 2013 NOBUOKA Yu

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    */
    class GifCompressedCodesToByteArrayConverter {
        private __out: number[];
        private __remNumBits: number;
        private __remVal: number;
        constructor() {
            this.__out = [];
            this.__remNumBits = 0;
            this.__remVal = 0;
        }
        push(code, numBits) {
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
        }
        flush() {
            this.push(0, 8);
            this.__remNumBits = 0;
            this.__remVal = 0;
            var out = this.__out;
            this.__out = [];
            return out;
        }
    }

    function compressWithLZW(actualCodes: Uint8Array, numBits: number): number[] {
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
        bb.push(clearCode, curNumCodeBits); // clear code at first

        var concatedCodesKey = "";
        for (var i = 0, len = actualCodes.length; i < len; ++i) {
            var code = actualCodes[i];
            var dictKey = String.fromCharCode(code);
            if (!(dictKey in dict)) dict[dictKey] = code;

            var oldKey = concatedCodesKey;
            concatedCodesKey += dictKey;
            if (!(concatedCodesKey in dict)) {
                bb.push(dict[oldKey], curNumCodeBits);

                // GIF spec defines a maximum code value of 4095 (0xFFF)
                if (nextCode <= 0xFFF) {
                    dict[concatedCodesKey] = nextCode;
                    if (nextCode === (1 << curNumCodeBits)) curNumCodeBits++;
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
    /*
    ===end GifWriter.js===
    */
}
