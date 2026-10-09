import { LoomManagement } from './loom-management';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('LoomManagement', () => {
  beforeEach(() => {
    return MockBuilder(LoomManagement);
  });

  it('should create', () => {
    const fixture = MockRender(LoomManagement);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
