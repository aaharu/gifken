/*!
 gifken
 Copyright (c) 2013 aaharu
 This software is released under the MIT License.
 https://raw.github.com/aaharu/gifken/master/LICENSE
 */

export class GifColor {
  public r: number;
  public g: number;
  public b: number;

  /**
   * GifColor
   */
  public constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  /**
   * TODO:
  static valueOf(color:string) {
  }
   */

  public static createColorTable(colors: GifColor[]): Uint8Array {
    const numbers: number[] = [];
    for (let i = 1; i <= 8; ++i) {
      const d = (i << 1) - colors.length;
      for (let j = 0; j < d; ++j) {
        colors.push(new GifColor(255, 255, 255));
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
