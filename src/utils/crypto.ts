// Web Crypto API helpers for NodeCrypt symmetric AES-GCM encryption/decryption
export async function encryptText(text: string, secretKey: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const encodedText = enc.encode(text);

    // Derive a cryptographic key from the user pass phrase
    const rawKey = enc.encode(secretKey);
    const hash = await window.crypto.subtle.digest('SHA-256', rawKey);
    
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encodedText
    );

    const encryptedArray = new Uint8Array(encryptedBuffer);
    
    // Package IV + Ciphertext as a single hex string
    const result = new Uint8Array(iv.length + encryptedArray.length);
    result.set(iv);
    result.set(encryptedArray, iv.length);

    return Array.from(result)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (err) {
    console.error('Encryption failed:', err);
    throw new Error('加密失败，请检查输入参数');
  }
}

export async function decryptText(hexString: string, secretKey: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    // Parse bytes from hex string
    const bytes = new Uint8Array(
      hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);

    // Derive the same key from pass phrase
    const rawKey = enc.encode(secretKey);
    const hash = await window.crypto.subtle.digest('SHA-256', rawKey);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );

    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error('Decryption failed:', err);
    throw new Error('解密失败，密码不正确或密文已损坏');
  }
}
