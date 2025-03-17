// Polyfill for crypto.getRandomValues in Node.js
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

export {}; 