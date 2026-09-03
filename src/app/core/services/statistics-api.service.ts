import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Statistic } from '../models';

@Injectable({ providedIn: 'root' })
export class StatisticsApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/statistics`;

  readonly statisticsResource = httpResource<Statistic[]>(() => this.baseUrl, {
    defaultValue: [],
  });
}
