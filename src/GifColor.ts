/*!
 gifken v0.5.0
 Copyright (c) 2013 aaharu
 This software is released under the MIT License.
 https://raw.github.com/aaharu/gifken/master/LICENSE
 */

export class GifColor {
  /**
   * GifColor
   */
  constructor(public r: number, public g: number, public b: number) {}

  /** TODO
    static valueOf(color:string) {
    }
    */

  static createColorTable(colors: GifColor[]): Uint8Array {
    var numbers: number[] = [];
    for (var i = 1; i <= 8; ++i) {
      var d = (i << 1) - colors.length;
      for (var j = 0; j < d; ++j) {
        colors.push(new GifColor(255, 255, 255));
      }
    }
    colors.forEach(color => {
      numbers.push(color.r);
      numbers.push(color.g);
      numbers.push(color.b);
    });
    return new Uint8Array(numbers);
  }
}
