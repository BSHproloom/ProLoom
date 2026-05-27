import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmProjects } from './am-projects';

describe('AmProjects', () => {
  let component: AmProjects;
  let fixture: ComponentFixture<AmProjects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmProjects],
    }).compileComponents();

    fixture = TestBed.createComponent(AmProjects);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
