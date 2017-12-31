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

import { GifColor as tmpGifColor } from './GifColor';
import { GifFrame as tmpGifFrame } from './GifFrame';
import { GifVersion as tmpGifVersion } from './GifVersion';
import { Gif as tmpGif } from './Gif';

export const Gif = tmpGif;
export const GifFrame = tmpGifFrame;
export const GifVersion = tmpGifVersion;
export const GifColor = tmpGifColor;
