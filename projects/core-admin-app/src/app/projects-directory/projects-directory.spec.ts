import { ProjectsDirectory } from './projects-directory';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('ProjectsDirectory', () => {
  beforeEach(() => {
    return MockBuilder(ProjectsDirectory);
  });

  it('should create', () => {
    const fixture = MockRender(ProjectsDirectory);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
