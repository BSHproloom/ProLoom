import { Samples } from './samples';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('Samples', () => {
  beforeEach(() => {
    return MockBuilder(Samples);
  });

  it('should create', () => {
    const fixture = MockRender(Samples);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
