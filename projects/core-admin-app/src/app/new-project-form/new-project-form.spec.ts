import { NewProjectForm } from './new-project-form';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('NewProjectForm', () => {
  beforeEach(() => {
    return MockBuilder(NewProjectForm);
  });

  it('should create', () => {
    const fixture = MockRender(NewProjectForm);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
