import { UpcomingJobOrders } from './upcoming-job-orders';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('UpcomingJobOrders', () => {
  beforeEach(() => {
    return MockBuilder(UpcomingJobOrders);
  });

  it('should create', () => {
    const fixture = MockRender(UpcomingJobOrders);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
