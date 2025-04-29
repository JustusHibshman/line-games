import { TestBed } from '@angular/core/testing';

import { RulePresetsService } from './rule-presets.service';

describe('RulePresetsService', () => {
  let service: RulePresetsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RulePresetsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
