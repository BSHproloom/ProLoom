import { DesignQueue } from './design-queue';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('DesignQueue', () => {
  beforeEach(() => {
    return MockBuilder(DesignQueue);
  });

  it('should create', () => {
    const fixture = MockRender(DesignQueue);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
