import { Dashboard } from './dashboard';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('Dashboard', () => {
  beforeEach(() => {
    return MockBuilder(Dashboard);
  });

  it('should create', () => {
    const fixture = MockRender(Dashboard);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
