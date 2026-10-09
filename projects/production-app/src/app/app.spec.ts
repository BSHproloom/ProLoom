import { App } from './app';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('App', () => {
  beforeEach(() => {
    return MockBuilder(App);
  });

  it('should create', () => {
    const fixture = MockRender(App);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
