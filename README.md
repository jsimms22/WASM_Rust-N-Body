https://www.joshfinnie.com/blog/using-webassembly-created-in-rust-for-fast-react-components/

to build the Rust, WebAssembly, and JavaScript:

$ npm run build

Hosting a Local Server

$ npm run dev

# Scripts Embedding in Package.json

    "dev": "webpack server",
    "build:wasm": "cargo build --target wasm32-unknown-unknown",
    "build:bindgen": "wasm-bindgen target/wasm32-unknown-unknown/debug/nbody_wasm.wasm --out-dir build",
    "build": "npm run build:wasm && npm run build:bindgen && npx webpack"