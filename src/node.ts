import * as gifken from '../crate/nodejs/gifken.js'

const reverse = async (data: Uint8Array) => gifken.reverse_gif(data)
const split = async (data: Uint8Array) => gifken.split_gif(data) as Uint8Array[]

export {reverse, split}
