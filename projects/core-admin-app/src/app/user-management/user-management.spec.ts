import { UserManagement } from './user-management';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('UserManagement', () => {
  beforeEach(() => {
    return MockBuilder(UserManagement);
  });

  it('should create', () => {
    const fixture = MockRender(UserManagement);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
