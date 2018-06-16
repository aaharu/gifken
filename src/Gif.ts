/*!
 gifken v0.5.0
 Copyright (c) 2013 aaharu
 This software is released under the MIT License.
 https://raw.github.com/aaharu/gifken/master/LICENSE

 This product includes following software:
 * GifWriter.js
 - Copyright (c) 2013 NOBUOKA Yu
 - https://github.com/nobuoka/GifWriter.js
 - https://raw.github.com/nobuoka/GifWriter.js/master/LICENSE.txt
 */

import { GifColor } from './GifColor';
import { GifFrame } from './GifFrame';
import { GifParser } from './GifParser';
import { GifVersion } from './GifVersion';
import { GifImage } from './GifImage';

export class Gif implements GifImage {
    /**
     * GIF Header block.
     */
    private _version:GifVersion;

    /**
     * GIF image width.
     */
    private _width:number;

    /**
     * GIF image height.
     */
    private _height:number;

    /**
     * The number of color in the Global Color Table.
     */
    private _globalTableSize:number;
    public colorResolution:number; // not supported
    public sortFlag:boolean; // not supported
    public bgColorIndex:number;
    public pixelAspectRatio:number; // not supported

    /**
     * The Global Color Table array.
     */
    private _globalColorTable:Uint8Array;
    public frames:GifFrame[];
    public isLoop:boolean;

    /**
     * The number of animation iteration count.
     * if this is 0, it is infinite.
     */
    private _loopCount:number;
    public frameIndex1:number = 0;
    public frameIndex2:number = 0;

    /**
     * Gif
     */
    constructor(skipDefault?:boolean) {
        this.frames = [];
        if (skipDefault) {
            return;
        }
        // default values
        this._version = GifVersion.GIF89a;
        this._width = 1;
        this._height = 1;
        this.colorResolution = 112; // not supported
        this.sortFlag = false; // not supported
        this.bgColorIndex = 1; // ?
        this.pixelAspectRatio = 0; // not supported
        this.globalColorTable = GifColor.createColorTable([
                new GifColor(0, 0, 0), new GifColor(255, 255, 255)
                ]);
    }

    /**
     * Parse Gif image from ArrayBuffer.
     *
     * @return {Gif} parsed gif object
     */
    static parse(buffer:ArrayBuffer):Gif {
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

    public versionName():string {
        return GifVersion[this._version];
    }

    public get version():GifVersion {
        return this._version;
    }

    public set version(v:GifVersion) {
        this._version = v;
    }

    public get width():number {
        return this._width;
    }

    public set width(width:number) {
        width = ~~width;
        if (width > 0xffff || width < 0) {
            throw new RangeError("width range error: " + width);
        }
        this._width = width
    }

    public get height():number {
        return this._height;
    }

    public set height(height:number) {
        height = ~~height;
        if (height > 0xffff || height < 0) {
            throw new RangeError("height range error: " + height);
        }
        this._height = height;
    }

    public get globalColorTable() {
        return this._globalColorTable;
    }

    public set globalColorTable(bytes:Uint8Array) {
        this._globalColorTable = bytes;
        this._globalTableSize = bytes.byteLength / 3;
        if (this.bgColorIndex === undefined) {
            this.bgColorIndex = this._globalTableSize - 1;
        }
    }

    public get globalTableSize():number {
        return this._globalTableSize;
    }

    public get loopCount():number {
        return this._loopCount;
    }

    public set loopCount(loopCount:number) {
        loopCount = ~~loopCount;
        if (loopCount > 0xffff || loopCount < 0) {
            throw new RangeError("loopCount range error: " + loopCount);
        }
        this._loopCount = loopCount;
    }

    public writeToArrayBuffer():Uint8Array[] {
        return Gif.writeToArrayBuffer(this);
    }

    /**
     * Convert Gif to Uint8Array[].
     *
     * @return {Uint8Array[]} array of Uint8Array
     */
    public static writeToArrayBuffer(gif:Gif):Uint8Array[] {
        var output:Uint8Array[] = [];

        // write header
        var header = new DataView(new ArrayBuffer(13));
        header.setUint8(0, 71); // G
        header.setUint8(1, 73); // I
        header.setUint8(2, 70); // F
        header.setUint8(3, 56); // 8
        if (gif.version === GifVersion.GIF89a) {
            header.setUint8(4, 57); // 9
        } else {
            header.setUint8(4, 55); // 7
        }
        header.setUint8(5, 97); // a
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
        output.push(new Uint8Array(header.buffer));
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
            output.push(new Uint8Array(appExt.buffer));
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
                output.push(new Uint8Array(image.buffer));
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
        return output;
    }

    /**
     * TODO
     **/
    public writeToArray():any {
        var output = Gif.writeToArrayBuffer(this);

        var arr:any = [];
        output.forEach((buffer) => {
            for (var i = 0, l = buffer.byteLength; i < l; ++i) {
                arr.push(buffer[i]);
            }
        });
        return arr;
    }

    /**
     * Split the animated GIF image.
     *
     * @return {Gif[]} array of Gif object
     */
    public split(overwrite:boolean):Gif[] {
        var res:Gif[] = [];
        if (overwrite) {
            this.frames.forEach((frame, index) => {
                var gif = new Gif();
                gif.version = this._version;
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
                gif.version = this._version;
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

    /**
     * Playback the animated GIF image.
     *
     * @return {Gif} Gif object
     */
    public playback(overwrite:boolean):Gif {
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
        res.version = this._version;
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

/*
 ===begin GifWriter.js===
 */
class GifCompressedCodesToByteArrayConverter {
    private __out:number[];
    private __remNumBits:number;
    private __remVal:number;

    constructor() {
        this.__out = [];
        this.__remNumBits = 0;
        this.__remVal = 0;
    }

    push(code:any, numBits:any) {
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

function compressWithLZW(actualCodes:Uint8Array, numBits:number):number[] {
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

    var nextCode = endOfInfoCode + 1;
    var curNumCodeBits = numBits + 1;
    var dict = Object.create(null);

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
