import { Reports } from './reports';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('Reports', () => {
  beforeEach(() => {
    return MockBuilder(Reports);
  });

  it('should create', () => {
    const fixture = MockRender(Reports);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
