import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly loadingSignal = signal(false);

  public readonly loading$ = this.loadingSignal.asReadonly();

  setLoading(loading: boolean): void {
    this.loadingSignal.set(loading);
  }
}
