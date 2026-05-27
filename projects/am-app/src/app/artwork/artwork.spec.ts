import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Artwork } from './artwork';

describe('Artwork', () => {
  let component: Artwork;
  let fixture: ComponentFixture<Artwork>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Artwork],
    }).compileComponents();

    fixture = TestBed.createComponent(Artwork);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
