import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpHoverBoxComponent } from './help-hover-box.component';

describe('HelpHoverBoxComponent', () => {
  let component: HelpHoverBoxComponent;
  let fixture: ComponentFixture<HelpHoverBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpHoverBoxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpHoverBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
