/// <reference types="svelte" />
/// <reference types="vite/client" />

// Import treści plików jako surowy tekst (np. `docs/DLC.md?raw`) — by przewodnik renderował się
// wprost z kontraktu i nigdy się z nim nie rozjechał (STUDIO §8).
declare module '*?raw' {
  const content: string;
  export default content;
}
