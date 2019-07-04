/*!
 gifken
 Copyright (c) 2013 aaharu
 This software is released under the MIT License.
 https://raw.github.com/aaharu/gifken/master/LICENSE
 */

export class GifPresenter {
  /**
   * Convert Gif to Blob.
   *
   * @return {Blob} BLOB
   */
  public static writeToBlob(bytes: Uint8Array[]): Blob {
    return new Blob(bytes, { type: "image/gif" });
  }

  /**
   * Convert Gif to Data-URL string.
   *
   * @return {string} Data-URL string
   */
  public static writeToDataUrl(bytes: Uint8Array[]): string {
    let str = "";
    bytes.forEach((buffer): void => {
      const codes: number[] = [];
      for (let i = 0, l = buffer.byteLength; i < l; ++i) {
        codes.push(buffer[i]);
      }
      str += String.fromCharCode.apply(null, codes);
    });
    return "data:image/gif;base64," + btoa(str);
  }
}
