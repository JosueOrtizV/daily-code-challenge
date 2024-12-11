import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoreChallengesComponent } from './more-challenges.component';

describe('MoreChallengesComponent', () => {
  let component: MoreChallengesComponent;
  let fixture: ComponentFixture<MoreChallengesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoreChallengesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoreChallengesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
