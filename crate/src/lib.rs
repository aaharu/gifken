mod utils;

use image::codecs::gif::{GifDecoder, GifEncoder, Repeat};
use image::{AnimationDecoder, Frame, ImageError};
use js_sys::{Array, Error, Uint8Array};
use std::vec::Vec;
use wasm_bindgen::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// #[wasm_bindgen]
// extern "C" {
//     // Access console.log() from the wasm module
//     #[wasm_bindgen(js_namespace = console)]
//     fn log(s: &str);

//     #[wasm_bindgen(js_namespace = console, js_name = log)]
//     fn log_u32(a: u32);
// }

fn collect_frames(data: &[u8]) -> Result<Vec<Frame>, ImageError> {
    let decoder = GifDecoder::new(data)?;
    let collect_frames = decoder.into_frames().collect_frames()?;
    Ok(collect_frames)
}

fn reverse(data: &[u8]) -> Result<Vec<u8>, ImageError> {
    utils::set_panic_hook();

    let frames = collect_frames(data)?;

    let mut reversed_frames = Vec::new();
    for frame in frames {
        let left = frame.left();
        let top = frame.top();
        let delay = frame.delay();
        let reversed_frame = Frame::from_parts(frame.into_buffer(), left, top, delay);
        reversed_frames.push(reversed_frame);
    }
    reversed_frames.reverse();

    let mut buffer = Vec::new();
    {
        let mut encoder = GifEncoder::new(&mut buffer);
        encoder.encode_frames(reversed_frames.into_iter())?;
        encoder.set_repeat(Repeat::Infinite)?;
    }

    Ok(buffer)
}

#[wasm_bindgen]
pub fn reverse_gif(data: &[u8]) -> Result<Vec<u8>, JsValue> {
    match reverse(data) {
        Ok(buffer) => Ok(buffer),
        Err(e) => {
            return Err(JsValue::from(Error::new(e.to_string().as_str())));
        }
    }
}

fn split(data: &[u8]) -> Result<Vec<Vec<u8>>, ImageError> {
    utils::set_panic_hook();

    let frames = collect_frames(data)?;

    // let mut buffers = Vec::new();
    // for (i, f) in frames.iter().enumerate() {
    //     let mut buffer = Vec::new();
    //     {
    //         let mut encoder = GifEncoder::new(&mut buffer);
    //         encoder.encode_frame(f.to_owned()).unwrap_or_default();
    //     }
    //     buffers.insert(i,  buffer);
    // }
    let buffers = frames
        .iter()
        .map(move |f| {
            let mut buffer = Vec::new();
            {
                let mut encoder = GifEncoder::new(&mut buffer);
                encoder.encode_frame(f.to_owned()).unwrap_or_default();
            }
            buffer
        })
        .collect::<Vec<_>>();

    Ok(buffers)
}

#[wasm_bindgen]
pub fn split_gif(data: &[u8]) -> Result<Array, JsValue> {
    match split(data) {
        Ok(buffers) => {
            let wrapper = Array::new_with_length(buffers.len() as u32);

            for (i, buffer) in buffers.iter().enumerate() {
                let uint8_array = Uint8Array::new_with_length(buffer.len() as u32);
                for (idx, b) in buffer.iter().enumerate() {
                    uint8_array.set_index(idx as u32, *b);
                }
                wrapper.set(i as u32, JsValue::from(uint8_array));
            }

            Ok(wrapper)
        }
        Err(e) => {
            return Err(JsValue::from(Error::new(e.to_string().as_str())));
        }
    }
}
