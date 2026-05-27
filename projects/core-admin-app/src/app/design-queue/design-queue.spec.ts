import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignQueue } from './design-queue';

describe('DesignQueue', () => {
  let component: DesignQueue;
  let fixture: ComponentFixture<DesignQueue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignQueue],
    }).compileComponents();

    fixture = TestBed.createComponent(DesignQueue);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
