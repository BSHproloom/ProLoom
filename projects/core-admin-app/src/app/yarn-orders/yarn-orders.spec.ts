import { YarnOrders } from './yarn-orders';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('YarnOrders', () => {
  beforeEach(() => {
    return MockBuilder(YarnOrders);
  });

  it('should create', () => {
    const fixture = MockRender(YarnOrders);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
