import { ProjectDetail } from './project-detail';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('ProjectDetail', () => {
  beforeEach(() => {
    return MockBuilder(ProjectDetail);
  });

  it('should create', () => {
    const fixture = MockRender(ProjectDetail);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
