/*!
 gifken
 Copyright (c) 2013 aaharu
 This software is released under the MIT License.
 https://raw.github.com/aaharu/gifken/master/LICENSE
 */

import { GifImage } from "./GifImage";
import { GifFrame } from "./GifFrame";
import { GifVersion } from "./GifVersion";

export class GifParser {
  public static readHeader(gif: GifImage, data: DataView): number {
    const version = String.fromCharCode(
      data.getUint8(0),
      data.getUint8(1),
      data.getUint8(2),
      data.getUint8(3),
      data.getUint8(4),
      data.getUint8(5)
    );
    if (version == GifVersion.GIF87a) {
      gif.version = GifVersion.GIF87a;
    } else {
      gif.version = GifVersion.GIF89a;
    }
    gif.width = data.getUint16(6, true);
    gif.height = data.getUint16(8, true);
    const packed = data.getUint8(10); // Global Color Table Flag(1 bit) Color Resolution(3 bits) Sort Flag(1 bit) Size of Global Color Table(3 bits)
    const tableFlag = packed & 128;
    let tableSize;
    if (tableFlag !== 128) {
      tableSize = 0;
    } else {
      tableSize = 1 << ((packed & 7) + 1);
    }
    gif.colorResolution = packed & 112;
    gif.sortFlag = (packed & 8) === 8;
    gif.bgColorIndex = data.getUint8(11);
    gif.pixelAspectRatio = data.getUint8(12);
    if (tableFlag !== 128) {
      return 13;
    }
    gif.globalColorTable = new Uint8Array(data.buffer, 13, 3 * tableSize);
    return 13 + 3 * tableSize;
  }

  public static readBlock(
    gif: GifImage,
    data: DataView,
    offset: number
  ): number {
    const separator = data.getUint8(offset);
    if (separator === 0x3b) {
      return -1;
    }
    if (separator === 0x21) {
      let frame: GifFrame;
      // Extension block
      const label = data.getUint8(offset + 1);
      if (label === 0xf9) {
        if (gif.frames[gif.frameIndex1] === undefined) {
          frame = new GifFrame();
          offset = this.readGraphicControlExtensionBlock(frame, data, offset);
          gif.frames.push(frame);
        } else {
          frame = gif.frames[gif.frameIndex1];
          offset = this.readGraphicControlExtensionBlock(frame, data, offset);
        }
        gif.frameIndex1 += 1;
        return offset;
      }
      if (label === 0xfe) {
        offset = this.readCommentExtensionBlock(data, offset);
        return offset;
      }
      if (label === 0xff) {
        offset = this.readApplicationExtensionBlock(gif, data, offset);
        return offset;
      }
      if (label === 0x01) {
        offset = this.readPlainTextExtensionBlock(data, offset);
        return offset;
      }
    }
    if (separator === 0x2c) {
      let frame: GifFrame;
      if (gif.frames[gif.frameIndex2] === undefined) {
        frame = new GifFrame();
        offset = this.readImageBlock(frame, data, offset);
        gif.frames.push(frame);
      } else {
        frame = gif.frames[gif.frameIndex2];
        offset = this.readImageBlock(frame, data, offset);
      }
      gif.frameIndex2 += 1;
      return offset;
    }

    return -1;
  }

  public static readImageBlock(
    frame: GifFrame,
    data: DataView,
    offset: number
  ): number {
    frame.x = data.getUint16(++offset, true);
    offset += 2;
    frame.y = data.getUint16(offset, true);
    offset += 2;
    frame.width = data.getUint16(offset, true);
    offset += 2;
    frame.height = data.getUint16(offset, true);
    offset += 2;
    const packed = data.getUint8(offset++);
    const tableFlag = packed & 128;
    if (tableFlag === 128) {
      frame.localTableSize = 1 << ((packed & 7) + 1);
      frame.localColorTable = new Uint8Array(
        data.buffer,
        offset,
        3 * frame.localTableSize
      );
      offset += 3 * frame.localTableSize;
    } else {
      frame.localTableSize = 0;
    }
    frame.lzwCode = data.getUint8(offset++);
    const dataList = new Array<Uint8Array>();
    let totalSize = 0;
    while (true) {
      const blockSize = data.getUint8(offset++);
      totalSize += blockSize;
      if (blockSize === 0) {
        break;
      }
      dataList.push(
        new Uint8Array(data.buffer.slice(offset, offset + blockSize))
      );
      offset += blockSize;
    }
    const bytes = new Uint8Array(totalSize);
    bytes.set(dataList[0], 0);
    let len = dataList[0].byteLength;
    for (let i = 1, l = dataList.length; i < l; ++i) {
      bytes.set(dataList[i], len);
      len += dataList[i].byteLength;
    }
    frame.compressedData = bytes;
    return offset;
  }

  public static readApplicationExtensionBlock(
    gif: GifImage,
    data: DataView,
    offset: number
  ): number {
    offset += 2;
    if (data.getUint8(offset++) !== 0x0b) {
      throw new Error("faild: _readApplicationExtensionBlock");
    }
    const app = String.fromCharCode(
      data.getUint8(offset++),
      data.getUint8(offset++),
      data.getUint8(offset++),
      data.getUint8(offset++),
      data.getUint8(offset++),
      data.getUint8(offset++),
      data.getUint8(offset++),
      data.getUint8(offset++),
      data.getUint8(offset++),
      data.getUint8(offset++),
      data.getUint8(offset++)
    );
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
      const blockSize = data.getUint8(offset++);
      if (blockSize === 0) {
        break;
      }
      offset += blockSize;
    }
    return offset;
  }

  public static readCommentExtensionBlock(
    data: DataView,
    offset: number
  ): number {
    // skip
    offset += 2;
    while (true) {
      const blockSize = data.getUint8(offset++);
      if (blockSize === 0) {
        break;
      }
      offset += blockSize;
    }
    return offset;
  }

  public static readGraphicControlExtensionBlock(
    frame: GifFrame,
    data: DataView,
    offset: number
  ): number {
    const packed = data.getUint8(offset + 3);
    frame.transparentFlag = (packed & 1) === 1;
    frame.delayCentiSeconds = data.getUint16(offset + 4, true);
    frame.transparentColorIndex = data.getUint8(offset + 6);
    return offset + 8;
  }

  public static readPlainTextExtensionBlock(
    data: DataView,
    offset: number
  ): number {
    // skip
    offset += 2;
    while (true) {
      const blockSize = data.getUint8(offset++);
      if (blockSize === 0) {
        break;
      }
      offset += blockSize;
    }
    return offset;
  }
}
