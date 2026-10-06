/**
 * Web Crypto API Implementation of ECDH (P-256) Key Agreement and AES-GCM (256-bit) E2EE
 */

// Generate ephemeral ECDH keypair
export async function generateECDHKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true,
    ["deriveKey", "deriveBits"]
  );
}

// Export public key to JWK
export async function exportPublicKey(key) {
  return await window.crypto.subtle.exportKey("jwk", key);
}

// Import peer's JWK public key
export async function importPeerPublicKey(jwk) {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: "P-256"
    },
    true,
    []
  );
}

// Derive AES-GCM 256-bit shared symmetric encryption key
export async function deriveSharedKey(localPrivateKey, peerPublicKey) {
  return await window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: peerPublicKey
    },
    localPrivateKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt", "decrypt"]
  );
}

// Compute 6-digit Safety Number / Key Fingerprint for verifying no MITM
export async function computeSafetyFingerprint(keyA, keyB) {
  const strA = JSON.stringify(keyA);
  const strB = JSON.stringify(keyB);
  const combined = [strA, strB].sort().join("::");

  const msgBuffer = new TextEncoder().encode(combined);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Convert first 4 bytes into a readable 6-digit numeric security code: e.g. "482 910"
  const val = (hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3];
  const absVal = Math.abs(val) % 1000000;
  const strVal = String(absVal).padStart(6, '0');
  return `${strVal.slice(0, 3)} ${strVal.slice(3, 6)}`;
}

// Encrypt plaintext with AES-GCM
export async function encryptE2EEMessage(aesKey, plaintext) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    aesKey,
    encoded
  );

  return {
    ciphertext: Array.from(new Uint8Array(ciphertextBuffer)),
    iv: Array.from(iv)
  };
}

// Decrypt ciphertext with AES-GCM
export async function decryptE2EEMessage(aesKey, { ciphertext, iv }) {
  const cipherBytes = new Uint8Array(ciphertext);
  const ivBytes = new Uint8Array(iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes
    },
    aesKey,
    cipherBytes
  );

  return new TextDecoder().decode(decryptedBuffer);
}
