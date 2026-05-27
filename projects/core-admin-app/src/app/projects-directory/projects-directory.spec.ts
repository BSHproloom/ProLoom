import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsDirectory } from './projects-directory';

describe('ProjectsDirectory', () => {
  let component: ProjectsDirectory;
  let fixture: ComponentFixture<ProjectsDirectory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsDirectory],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsDirectory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
