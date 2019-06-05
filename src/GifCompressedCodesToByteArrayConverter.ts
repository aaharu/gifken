/*!
 gifken
 Copyright (c) 2013 aaharu
 This software is released under the MIT License.
 https://raw.github.com/aaharu/gifken/master/LICENSE

 This product includes following software:
 * GifWriter.js
 - Copyright (c) 2013 NOBUOKA Yu
 - https://github.com/nobuoka/GifWriter.js
 - https://raw.github.com/nobuoka/GifWriter.js/master/LICENSE.txt
 */

/*
 ===begin GifWriter.js===
 */
export class GifCompressedCodesToByteArrayConverter {
  private __out: number[];
  private __remNumBits: number;
  private __remVal: number;

  public constructor() {
    this.__out = [];
    this.__remNumBits = 0;
    this.__remVal = 0;
  }

  public push(code: any, numBits: any) {
    while (numBits > 0) {
      this.__remVal = ((code << this.__remNumBits) & 0xff) + this.__remVal;
      if (numBits + this.__remNumBits >= 8) {
        this.__out.push(this.__remVal);
        numBits = numBits - (8 - this.__remNumBits);
        code = code >> (8 - this.__remNumBits);
        this.__remVal = 0;
        this.__remNumBits = 0;
      } else {
        this.__remNumBits = numBits + this.__remNumBits;
        numBits = 0;
      }
    }
  }

  public flush() {
    this.push(0, 8);
    this.__remNumBits = 0;
    this.__remVal = 0;
    var out = this.__out;
    this.__out = [];
    return out;
  }
}
/*
 ===end GifWriter.js===
 */
