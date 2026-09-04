import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly baseUrl = `${environment.apiBaseUrl}/users`;

  readonly usersResource = httpResource<User[]>(() => this.baseUrl, {
    defaultValue: [],
  });
}
