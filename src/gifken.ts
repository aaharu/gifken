import init, {reverse_gif, split_gif} from '../crate/web/gifken.js'

const reverse = async (data: Uint8Array) => {
  await init()
  return reverse_gif(data)
}

const split = async (data: Uint8Array) => {
  await init()
  return split_gif(data) as Uint8Array[]
}

export {reverse, split}
