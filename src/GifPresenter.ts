/*!
 gifken
 Copyright (c) 2013 aaharu
 This software is released under the MIT License.
 https://raw.github.com/aaharu/gifken/master/LICENSE
 */

// @ts-ignore
import { isBrowser, isWebWorker } from "browser-or-node";

export class GifPresenter {
  /**
   * Convert Gif to Blob.
   *
   * @return {Blob} BLOB
   */
  public static writeToBlob(bytes: Uint8Array[]): Blob {
    if (isBrowser || isWebWorker || typeof Blob === "function") {
      return new Blob(bytes, { type: "image/gif" });
    }
    throw new Error("writeToBlob is browser-only function");
  }

  /**
   * Convert Gif to Data-URL string.
   *
   * @return {string} Data-URL string
   */
  public static writeToDataUrl(bytes: Uint8Array[]): string {
    if (isBrowser || isWebWorker) {
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
    return "data:image/gif;base64," + Buffer.from(bytes).toString("base64");
  }
}
