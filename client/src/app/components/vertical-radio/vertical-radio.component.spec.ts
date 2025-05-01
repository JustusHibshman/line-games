import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerticalRadioComponent } from './vertical-radio.component';

describe('VerticalRadioComponent', () => {
  let component: VerticalRadioComponent;
  let fixture: ComponentFixture<VerticalRadioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerticalRadioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerticalRadioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
