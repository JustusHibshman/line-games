import { TestBed } from '@angular/core/testing';

import { ClientAIService } from './client-a-i.service';

describe('ClientAIService', () => {
  let service: ClientAIService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientAIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
