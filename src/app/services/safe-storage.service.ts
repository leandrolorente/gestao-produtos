import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SafeStorageService {
  private isStorageAvailable(): boolean {
    try {
      return typeof Storage !== 'undefined' && typeof localStorage !== 'undefined';
    } catch (error) {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage não está disponível');
      return null;
    }

    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Erro ao acessar localStorage:', error);
      return null;
    }
  }

  setItem(key: string, value: string): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage não está disponível');
      return false;
    }

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      return false;
    }
  }

  removeItem(key: string): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage não está disponível');
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erro ao remover do localStorage:', error);
      return false;
    }
  }

  clear(): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage não está disponível');
      return false;
    }

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
      return false;
    }
  }
}
