import { TestBed } from '@angular/core/testing';

import { DashboardRedirectService } from './dashboard-redirect.service';

describe('DashboardRedirectService', () => {
  let service: DashboardRedirectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardRedirectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
