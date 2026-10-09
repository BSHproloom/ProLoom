import { SpotSearchComponent } from './spot-search';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('SpotSearchComponent', () => {
  beforeEach(() => {
    return MockBuilder(SpotSearchComponent);
  });

  it('should create', () => {
    const fixture = MockRender(SpotSearchComponent);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
