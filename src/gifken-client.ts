/*!
 gifken v0.5.0
 Copyright (c) 2013 aaharu
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

import { GifColor } from "./GifColor";
import { GifFrame } from "./GifFrame";
import { GifParser } from "./GifParser";
import { GifVersion } from "./GifVersion";
import { Gif } from "./Gif";
import { GifPresenter } from "./GifPresenter";

(<any>(window || self)).gifken = {
  Gif: Gif,
  GifFrame: GifFrame,
  GifColor: GifColor,
  GifParser: GifParser,
  GifVersion: GifVersion,
  GifPresenter: GifPresenter
};
