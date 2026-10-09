import { Leaderboard } from './leaderboard';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('Leaderboard', () => {
  beforeEach(() => {
    return MockBuilder(Leaderboard);
  });

  it('should create', () => {
    const fixture = MockRender(Leaderboard);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
