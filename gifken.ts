export * from "./src/Gif";
export * from "./src/GifColor";
export * from "./src/GifFrame";
export * from "./src/GifParser";
export * from "./src/GifVersion";
export * from "./src/GifPresenter";

import { Gif } from "./src/Gif";
import { GifColor } from "./src/GifColor";
import { GifFrame } from "./src/GifFrame";
import { GifParser } from "./src/GifParser";
import { GifVersion } from "./src/GifVersion";
import { GifPresenter } from "./src/GifPresenter";
const gifken = {
  Gif: Gif,
  GifColor: GifColor,
  GifFrame: GifFrame,
  GifParser: GifParser,
  GifVersion: GifVersion,
  GifPresenter: GifPresenter,
};
export default gifken;
