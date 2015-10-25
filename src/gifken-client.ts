/*!
 gifken v0.1.0
 Copyright (c) 2013-2015 aaharu
 This software is released under the MIT License.
 https://raw.github.com/aaharu/gifken/master/LICENSE

 This product includes following software:
 * jsgif
 - Copyright (c) 2011 Shachaf Ben-Kiki
 - https://github.com/shachaf/jsgif
 - https://raw.github.com/shachaf/jsgif/master/LICENSE
 * GifWriter.js
 - Copyright (c) 2013 NOBUOKA Yu
 - https://github.com/nobuoka/GifWriter.js
 - https://raw.github.com/nobuoka/GifWriter.js/master/LICENSE.txt
 */

import { Gif, GifFrame, GifColor, GifParser, GifVersion } from "./gifken";

export class GifPresenter {
    /**
     * Convert Gif to Blob.
     *
     * @static
     * @method writeToBlob
     * @param {Uint8Array[]} bytes
     * @return {Blob} BLOB
     **/
    static writeToBlob(bytes:Uint8Array[]):Blob {
        return new Blob(bytes, { "type": "image/gif" });
    }

    /**
     * Convert Gif to Data-URL string.
     *
     * @static
     * @method writeToDataUrl
     * @param {Uint8Array[]} bytes
     * @return {string} Data-URL string
     **/
    static writeToDataUrl(bytes:Uint8Array[]):string {
        var str = "";
        bytes.forEach((buffer) => {
            var codes:number[] = [];
            for (var i = 0, l = buffer.byteLength; i < l; ++i) {
                codes.push(buffer[i]);
            }
            str += String.fromCharCode.apply(null, codes);
        });
        return "data:image/gif;base64," + btoa(str);
    }
}

(<any>(window || self)).gifken = {
	Gif: Gif,
	GifFrame: GifFrame,
	GifColor: GifColor,
	GifParser: GifParser,
	GifVersion: GifVersion,
	GifPresenter: GifPresenter
};