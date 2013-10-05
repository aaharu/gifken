/*!
gifken v0.0.1
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
module gifken {
    export class Gif {
        private _standard: string;
        private _width: number;
        private _height: number;
        private _globalTableSize: number;
        public colorResolution: number; // not supported
        public sortFlag: boolean; // not supported
        public bgColorIndex: number;
        public pixelAspectRatio: number; // not supported
        private _globalColorTable: Uint8Array;
        public frames: Frame[];
        public isLoop: boolean;
        private _loopCount: number;

        constructor(skipDefault?: boolean) {
            this.frames = [];
            if (skipDefault) {
                return;
            }
            // default values
            this._standard = "GIF89a";
            this._width = 1;
            this._height = 1;
            this.colorResolution = 112; // not supported
            this.sortFlag = false; // not supported
            this.bgColorIndex = 1; // ?
            this.pixelAspectRatio = 0; // not supported
            this.globalColorTable = Color.createColorTable([new Color(0, 0, 0), new Color(255, 255, 255)]);
        }

        static parse(buffer: ArrayBuffer): Gif {
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
        }

        public get standard(): string {
            return this._standard;
        }

        public set standard(std: string) {
            if (std !== "GIF89a" && std !== "GIF87a") {
                throw new Error("failed gif format");
            }
            this._standard = std;
        }

        public get width(): number {
            return this._width;
        }

        public set width(width: number) {
            width = ~~width;
            if (width > 0xffff || width < 0) {
                throw new RangeError("width range error: " + width);
            }
            this._width = width
        }

        public get height(): number {
            return this._height;
        }

        public set height(height: number) {
            height = ~~height;
            if (height > 0xffff || height < 0) {
                throw new RangeError("height range error: " + height);
            }
            this._height = height;
        }

        public get globalColorTable() {
            return this._globalColorTable;
        }

        public set globalColorTable(bytes: Uint8Array) {
            this._globalColorTable = bytes;
            this._globalTableSize = bytes.byteLength / 3;
            if (this.bgColorIndex === undefined) {
                this.bgColorIndex = this._globalTableSize - 1;
            }
        }

        public get globalTableSize(): number {
            return this._globalTableSize;
        }

        public get loopCount(): number {
            return this._loopCount;
        }

        public set loopCount(loopCount: number) {
            loopCount = ~~loopCount;
            if (loopCount > 0xffff || loopCount < 0) {
                throw new RangeError("loopCount range error: " + loopCount);
            }
            this._loopCount = loopCount;
        }

        public writeToBlob(): Blob {
            return Gif.writeToBlob(this);
        }

        static writeToBlob(gif: Gif): Blob {
            var output: ArrayBufferView[] = [];

            // write header
            var header = new DataView(new ArrayBuffer(13));
            header.setUint8(0, 71);
            header.setUint8(1, 73);
            header.setUint8(2, 70);
            header.setUint8(3, 56);
            if (gif.standard === "GIF89a") {
                header.setUint8(4, 57);
            } else {
                header.setUint8(4, 55);
            }
            header.setUint8(5, 97);
            header.setUint16(6, gif.width, true);
            header.setUint16(8, gif.height, true);
            var packed = 0;
            var size = gif.globalTableSize;
            if (size > 0) {
                packed |= 128;
                var count = 0;
                do {
                    size = size >> 1;
                    ++count;
                } while (size > 1);
                packed |= count - 1;
            }
            packed |= gif.colorResolution; // not supported
            if (gif.sortFlag) { // not supported
                packed |= 8;
            }
            header.setUint8(10, packed);
            header.setUint8(11, gif.bgColorIndex);
            header.setUint8(12, gif.pixelAspectRatio); // not supported
            output.push(header);
            if (gif.globalTableSize > 0) {
                output.push(gif.globalColorTable);
            }

            // write extension
            if (gif.isLoop) {
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
                appExt.setUint16(16, gif.loopCount, true);
                appExt.setUint8(18, 0);
                output.push(appExt);
            }

            // write image data
            gif.frames.forEach((frame) => {
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
                if (frame.compressedData === undefined && frame.pixelData === undefined) {
                    throw new Error("no image data");
                }
                var idx = 0, compressedBytes = frame.compressedData;
                if (compressedBytes instanceof Array) {
                    compressedBytes = new Uint8Array(compressedBytes);
                } else {
                    compressedBytes = compressedBytes || new Uint8Array(compressWithLZW(frame.pixelData, frame.lzwCode));
                }
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

            output.push(new Uint8Array([0x3b])); // trailer
            return new Blob(output, { "type": "image/gif" });
        }

        public writeToDataUrl(): string {
            return Gif.writeToDataUrl(this);
        }

        static writeToDataUrl(gif: Gif): string {
            // TODO
            var output: ArrayBufferView[] = [];

            // write header
            var header = new DataView(new ArrayBuffer(13));
            header.setUint8(0, 71);
            header.setUint8(1, 73);
            header.setUint8(2, 70);
            header.setUint8(3, 56);
            if (gif.standard === "GIF89a") {
                header.setUint8(4, 57);
            } else {
                header.setUint8(4, 55);
            }
            header.setUint8(5, 97);
            header.setUint16(6, gif.width, true);
            header.setUint16(8, gif.height, true);
            var packed = 0;
            var size = gif.globalTableSize;
            if (size > 0) {
                packed |= 128;
                var count = 0;
                do {
                    size = size >> 1;
                    ++count;
                } while (size > 1);
                packed |= count - 1;
            }
            packed |= gif.colorResolution; // not supported
            if (gif.sortFlag) { // not supported
                packed |= 8;
            }
            header.setUint8(10, packed);
            header.setUint8(11, gif.bgColorIndex);
            header.setUint8(12, gif.pixelAspectRatio); // not supported
            output.push(header);
            if (gif.globalTableSize > 0) {
                output.push(gif.globalColorTable);
            }

            // write extension
            if (gif.isLoop) {
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
                appExt.setUint16(16, gif.loopCount, true);
                appExt.setUint8(18, 0);
                output.push(appExt);
            }

            // write image data
            gif.frames.forEach((frame) => {
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
                if (frame.compressedData === undefined && frame.pixelData === undefined) {
                    throw new Error("no image data");
                }
                var idx = 0, compressedBytes = frame.compressedData;
                if (compressedBytes instanceof Array) {
                    compressedBytes = new Uint8Array(compressedBytes);
                } else {
                    compressedBytes = compressedBytes || new Uint8Array(compressWithLZW(frame.pixelData, frame.lzwCode));
                }
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

            output.push(new Uint8Array([0x3b])); // trailer

            var str: string = "";
            output.forEach((buffer) => {
                var codes: number[] = [];
                if (buffer instanceof Uint8Array === false) {
                    buffer = new Uint8Array(buffer.buffer);
                }
                for (var i = 0, l = buffer.byteLength; i < l; ++i) {
                    codes.push(buffer[i]);
                }
                str += String.fromCharCode.apply(null, codes);
            });
            return "data:image/gif;base64," + btoa(str);
        }

        public split(orverwrite: boolean): Gif[] {
            var res: Gif[] = [];
            if (orverwrite) {
                this.frames.forEach((frame, index) => {
                    var gif = new Gif();
                    gif.standard = this._standard;
                    gif.width = this._width;
                    gif.height = this._height;
                    gif.colorResolution = this.colorResolution; // not supported
                    gif.sortFlag = this.sortFlag; // not supported
                    gif.bgColorIndex = this.bgColorIndex;
                    gif.pixelAspectRatio = this.pixelAspectRatio; // not supported
                    gif.globalColorTable = this._globalColorTable;
                    if (index !== 0 && frame.transparentFlag) {
                        if (frame.pixelData === undefined) {
                            frame.decompress();
                        }
                        if (this.frames[index - 1].pixelData === undefined) {
                            this.frames[index - 1].decompress();
                        }
                        var edited = false;
                        for (var i = 0, l = frame.pixelData.length; i < l; ++i) {
                            if (frame.pixelData[i] === frame.transparentColorIndex) {
                                frame.pixelData[i] = this.frames[index - 1].pixelData[i];
                                edited = true;
                            }
                        }
                        if (edited) {
                            var compressedBytes = compressWithLZW(frame.pixelData, frame.lzwCode);
                            frame.compressedData = new Uint8Array(compressedBytes);
                        }
                        delete frame.pixelData;
                    }
                    gif.frames = [frame];
                    res.push(gif);
                });
            } else {
                this.frames.forEach((frame) => {
                    var gif = new Gif();
                    gif.standard = this._standard;
                    gif.width = this._width;
                    gif.height = this._height;
                    gif.colorResolution = this.colorResolution; // not supported
                    gif.sortFlag = this.sortFlag; // not supported
                    gif.bgColorIndex = this.bgColorIndex;
                    gif.pixelAspectRatio = this.pixelAspectRatio; // not supported
                    gif.globalColorTable = this._globalColorTable;
                    gif.frames = [frame];
                    res.push(gif);
                });
            }
            return res;
        }

        public playback(overwrite: boolean): Gif {
            var res = new Gif();
            if (overwrite) {
                this.frames.forEach((frame, index) => {
                    if (index !== 0 && frame.transparentFlag) {
                        if (frame.pixelData === undefined) {
                            frame.decompress();
                        }
                        if (this.frames[index - 1].pixelData === undefined) {
                            this.frames[index - 1].decompress();
                        }
                        var edited = false;
                        for (var i = 0, l = frame.pixelData.length; i < l; ++i) {
                            if (frame.pixelData[i] === frame.transparentColorIndex) {
                                frame.pixelData[i] = this.frames[index - 1].pixelData[i];
                                edited = true;
                            }
                        }
                        if (edited) {
                            var compressedBytes = compressWithLZW(frame.pixelData, frame.lzwCode);
                            frame.compressedData = new Uint8Array(compressedBytes);
                        }
                        delete frame.pixelData;
                    }
                });
            }
            res.standard = this._standard;
            res.width = this._width;
            res.height = this._height;
            res.colorResolution = this.colorResolution; // not supported
            res.sortFlag = this.sortFlag; // not supported
            res.bgColorIndex = this.bgColorIndex;
            res.pixelAspectRatio = this.pixelAspectRatio; // not supported
            res.globalColorTable = this._globalColorTable;
            res.frames = this.frames.reverse();
            res.isLoop = this.isLoop;
            res.loopCount = this._loopCount;
            return res;
        }
    }

    export class Frame {
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
        public compressedData: Uint8Array;
        public pixelData: Uint8Array; // decompressed

        constructor(gif: Gif) {
        }

        static init(gif: Gif) {
            var frame = new Frame(gif);
            frame.transparentFlag = false;
            frame.delayCentiSeconds = 0;
            frame.transparentColorIndex = 0;
            frame.x = 0;
            frame.y = 0;
            frame.width = gif.width || 1;
            frame.height = gif.height || 1;
            frame.localTableSize = 0;
            frame.lzwCode = 4; // ?
            frame.pixelData = new Uint8Array(frame.width * frame.height);
            return frame;
        }

        public decompress() {
            this.pixelData = lzwDecode(this.lzwCode, this.compressedData, this.width * this.height);
        }
    }

    export class Color {
        constructor(public r: number, public g: number, public b: number) {
        }

        static valueOf(color: string) {
            // TODO
        }

        static createColorTable(colors: Color[]): Uint8Array {
            var numbers: number[] = [];
            for (var i = 1; i <= 8; ++i) {
                var d = (i << 1) - colors.length;
                for (var j = 0; j < d; ++j) {
                    colors.push(new Color(255, 255, 255));
                }
            }
            colors.forEach((color) => {
                numbers.push(color.r);
                numbers.push(color.g);
                numbers.push(color.b);
            });
            return new Uint8Array(numbers);
        }
    }

    class GifParser {
        static readHeader(gif: Gif, data: DataView): number {
            gif.standard = String.fromCharCode(data.getUint8(0), data.getUint8(1), data.getUint8(2), data.getUint8(3), data.getUint8(4), data.getUint8(5));
            gif.width = data.getUint16(6, true);
            gif.height = data.getUint16(8, true);
            var packed = data.getUint8(10); // Global Color Table Flag(1 bit) Color Resolution(3 bits) Sort Flag(1 bit) Size of Global Color Table(3 bits)
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
        }

        static readBlock(gif: Gif, data: DataView, offset: number): number {
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
        }

        static readImageBlock(gif: Gif, data: DataView, offset: number, frame: Frame): number {
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
            var totalSize = 0;
            while (true) {
                var blockSize = data.getUint8(offset++);
                totalSize += blockSize;
                if (blockSize === 0) {
                    break;
                }
                dataList.push(new Uint8Array((<any>data.buffer).slice(offset, offset + blockSize)));
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
        }

        static readApplicationExtensionBlock(gif: Gif, data: DataView, offset: number): number {
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
        }

        static readCommentExtensionBlock(gif: Gif, data: DataView, offset: number): number {
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
        }

        static readGraphicControlExtensionBlock(gif: Gif, data: DataView, offset: number, frame: Frame): number {
            var packed = data.getUint8(offset + 3);
            frame.transparentFlag = (packed & 1) === 1;
            frame.delayCentiSeconds = data.getUint16(offset + 4, true);
            frame.transparentColorIndex = data.getUint8(offset + 6);
            return offset + 8;
        }

        static readPlainTextExtensionBlock(gif: Gif, data: DataView, offset: number): number {
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
        }
    }

    /*
    ===begin jsgif===
    */
    var lzwDecode = function (minCodeSize: number, data: Uint8Array, len: number): Uint8Array {
        var pos = 0; // Maybe this streaming thing should be merged with the Stream?

        var readCode = function (size): number {
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

        return output;
    };
    /*
    ===end jsgif===
    */

    /*
    ===begin GifWriter.js===
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
