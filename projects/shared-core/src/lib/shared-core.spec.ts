import { SharedCore } from './shared-core';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('SharedCore', () => {
  beforeEach(() => {
    return MockBuilder(SharedCore);
  });

  it('should create', () => {
    const fixture = MockRender(SharedCore);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
