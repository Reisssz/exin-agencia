import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { PortfolioItem } from './portfolio.types';

@Injectable({ providedIn: 'root' })
export class PortfolioApiService {
  private readonly http = inject(HttpClient);

  getPortfolio(): Observable<PortfolioItem[]> {
    return this.http.get<PortfolioItem[]>('/api/portfolio').pipe(timeout(5000));
  }
}
