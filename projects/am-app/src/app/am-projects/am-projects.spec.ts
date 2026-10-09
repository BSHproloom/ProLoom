import { AmProjects } from './am-projects';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('AmProjects', () => {
  beforeEach(() => {
    return MockBuilder(AmProjects);
  });

  it('should create', () => {
    const fixture = MockRender(AmProjects);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
