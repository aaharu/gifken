/*!
 gifken v0.5.0
 Copyright (c) 2013 aaharu
 This software is released under the MIT License.
 https://raw.github.com/aaharu/gifken/master/LICENSE
 */

import { GifFrame } from "./GifFrame";
import { GifVersion } from "./GifVersion";

export interface GifImage {
  colorResolution: number; // not supported
  sortFlag: boolean; // not supported
  bgColorIndex: number;
  pixelAspectRatio: number; // not supported
  frames: GifFrame[];
  isLoop: boolean;
  frameIndex1: number;
  frameIndex2: number;
  version: GifVersion;
  width: number;
  height: number;
  globalColorTable: Uint8Array;
  loopCount: number;
}
