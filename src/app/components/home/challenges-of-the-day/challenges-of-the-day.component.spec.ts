import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChallengesOfTheDayComponent } from './challenges-of-the-day.component';

describe('ChallengesOfTheDayComponent', () => {
  let component: ChallengesOfTheDayComponent;
  let fixture: ComponentFixture<ChallengesOfTheDayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChallengesOfTheDayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChallengesOfTheDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
