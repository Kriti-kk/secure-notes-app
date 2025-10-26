// Encryption Service using CryptoJS
class CryptoService {
  constructor() {
    this.encryptionKey = null;
    this.masterSalt = null;
  }

  // Generate a random salt
  generateSalt() {
    return CryptoJS.lib.WordArray.random(16).toString();
  }

  // Derive encryption key from password using PBKDF2
  deriveKey(password, salt) {
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 100000,
      hasher: CryptoJS.algo.SHA256
    }).toString();
  }

  // Set the encryption key
  setKey(key) {
    this.encryptionKey = key;
  }

  // Get password strength
  getPasswordStrength(password) {
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strength >= 3 && password.length >= 12) return 'strong';
    if (strength >= 2 && password.length >= 8) return 'medium';
    return 'weak';
  }

  // Encrypt note data
  encrypt(noteData) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not set');
    }

    try {
      const iv = CryptoJS.lib.WordArray.random(16);
      const jsonData = JSON.stringify(noteData);
      
      const encrypted = CryptoJS.AES.encrypt(jsonData, this.encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      return {
        encryptedData: encrypted.toString(),
        iv: iv.toString()
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt note data
  decrypt(encryptedData, iv) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not set');
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedStr) {
        throw new Error('Decryption failed - empty result');
      }

      return JSON.parse(decryptedStr);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data - incorrect password or corrupted data');
    }
  }

  // Export encrypted backup
  exportBackup(notes) {
    const backup = {
      version: 1,
      timestamp: Date.now(),
      notes: notes,
      salt: this.masterSalt
    };
    return JSON.stringify(backup, null, 2);
  }

  // Import encrypted backup
  importBackup(backupJson) {
    try {
      const backup = JSON.parse(backupJson);
      if (!backup.version || !backup.notes) {
        throw new Error('Invalid backup format');
      }
      return backup;
    } catch (error) {
      throw new Error('Failed to parse backup file');
    }
  }
}

window.cryptoService = new CryptoService();