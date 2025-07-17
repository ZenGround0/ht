// Crypto utility functions for password hashing, encryption and decryption

async function sha256(message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function deriveKey(password, forEncryption = false) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: enc.encode('treasure-hunt-2025'),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        forEncryption ? ['encrypt'] : ['decrypt']
    );
}

async function encrypt(plaintext, password) {
    try {
        const key = await deriveKey(password, true);
        const enc = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            enc.encode(plaintext)
        );
        
        // The encrypted result includes the auth tag at the end
        const encryptedArray = new Uint8Array(encrypted);
        
        // Combine IV + encrypted data (which includes auth tag)
        const combined = new Uint8Array(iv.length + encryptedArray.length);
        combined.set(iv);
        combined.set(encryptedArray, iv.length);
        
        // Convert to base64
        let binary = '';
        combined.forEach(byte => binary += String.fromCharCode(byte));
        return btoa(binary);
    } catch (e) {
        console.error('Encryption failed:', e);
        return null;
    }
}

async function decrypt(ciphertext, password) {
    try {
        const key = await deriveKey(password, false);
        const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
        
        const iv = combined.slice(0, 12);
        const encryptedWithTag = combined.slice(12);
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encryptedWithTag
        );
        
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error('Decryption failed:', e);
        return null;
    }
}

// Export for ES6 modules
export { sha256, encrypt, decrypt };

// Also export for legacy scripts
if (typeof window !== 'undefined') {
    window.cryptoUtils = {
        sha256,
        encrypt,
        decrypt
    };
}