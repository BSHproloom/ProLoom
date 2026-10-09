import { Production } from './production';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('Production', () => {
  beforeEach(() => {
    return MockBuilder(Production);
  });

  it('should create', () => {
    const fixture = MockRender(Production);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
