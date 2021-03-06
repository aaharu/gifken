/*!
 gifken
 Copyright (c) 2013 aaharu
 This software is released under the MIT License.
 https://raw.github.com/aaharu/gifken/master/LICENSE

 This product includes following software:
 * jsgif
 - Copyright (c) 2011 Shachaf Ben-Kiki
 - https://github.com/shachaf/jsgif
 - https://raw.github.com/shachaf/jsgif/master/LICENSE
 */

export class GifFrame {
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

  public static init(width: number, height: number): GifFrame {
    const frame = new GifFrame();
    frame.transparentFlag = false;
    frame.delayCentiSeconds = 0;
    frame.transparentColorIndex = 0;
    frame.x = 0;
    frame.y = 0;
    frame.width = width || 1;
    frame.height = height || 1;
    frame.localTableSize = 0;
    frame.lzwCode = 4; // ?
    frame.pixelData = new Uint8Array(frame.width * frame.height);
    return frame;
  }

  public decompress(): void {
    this.pixelData = this.lzwDecode(
      this.lzwCode,
      this.compressedData,
      this.width * this.height
    );
  }

  /*
   ===begin jsgif===
   */
  private lzwDecode(
    minCodeSize: number,
    data: Uint8Array,
    len: number
  ): Uint8Array {
    let pos = 0; // Maybe this streaming thing should be merged with the Stream?

    const readCode = function (size: number): number {
      let code = 0;
      for (let i = 0; i < size; ++i) {
        if (data[pos >> 3] & (1 << (pos & 7))) {
          code |= 1 << i;
        }
        ++pos;
      }
      return code;
    };

    const output = new Uint8Array(len);

    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;

    let codeSize = minCodeSize + 1;

    let dict: number[][] = [];

    const clear = (): void => {
      dict = [];
      codeSize = minCodeSize + 1;
      for (let i = 0; i < clearCode; ++i) {
        dict[i] = [i];
      }
      dict[clearCode] = [];
    };

    let code = 0;
    let last: number;
    let offset = 0;

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
        if (code !== dict.length) throw new Error("Invalid LZW code.");
        dict.push(dict[last].concat(dict[last][0]));
      }
      output.set(dict[code], offset);
      offset += dict[code].length;

      if (dict.length === 1 << codeSize && codeSize < 12) {
        // If we're at the last code and codeSize is 12, the next code will be a clearCode, and it'll be 12 bits long.
        codeSize++;
      }
    }

    return output;
  }
  /*
   ===end jsgif===
   */
}
