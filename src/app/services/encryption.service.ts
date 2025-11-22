import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {

  /**
   * Encrypts data using AES encryption with a password
   */
  encrypt(data: any, password: string): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, password).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts AES encrypted data using a password
   */
  decrypt<T>(encryptedData: string, password: string): T {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, password);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!jsonString) {
        throw new Error('Invalid password or corrupted data');
      }

      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data. Please check your password.');
    }
  }

  /**
   * Generates a hash of the password for verification
   */
  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  /**
   * Verifies if a password matches a hash
   */
  verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }
}
