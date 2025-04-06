import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerTypeSelectorComponent } from './player-type-selector.component';

describe('PlayerTypeSelectorComponent', () => {
  let component: PlayerTypeSelectorComponent;
  let fixture: ComponentFixture<PlayerTypeSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerTypeSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerTypeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
