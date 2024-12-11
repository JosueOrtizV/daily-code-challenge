import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyCodeChallengeComponent } from './daily-code-challenge.component';

describe('DailyCodeChallengeComponent', () => {
  let component: DailyCodeChallengeComponent;
  let fixture: ComponentFixture<DailyCodeChallengeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyCodeChallengeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyCodeChallengeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
