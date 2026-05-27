import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewProjectForm } from './new-project-form';

describe('NewProjectForm', () => {
  let component: NewProjectForm;
  let fixture: ComponentFixture<NewProjectForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewProjectForm],
    }).compileComponents();

    fixture = TestBed.createComponent(NewProjectForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
