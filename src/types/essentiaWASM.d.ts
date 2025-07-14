// essentia-wasm.d.ts
declare module 'essentia.js/dist/essentia-wasm.es.js' {
  const EssentiaWASM: {
    // Add the actual WASM exports you need here
    // Example:
    _malloc: (size: number) => number;
    _free: (ptr: number) => void;
    // Add other WASM exports as needed
  };
  export default EssentiaWASM;
}