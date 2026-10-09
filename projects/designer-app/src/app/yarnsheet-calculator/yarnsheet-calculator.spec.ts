import { YarnsheetCalculator } from './yarnsheet-calculator';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('YarnsheetCalculator', () => {
  beforeEach(() => {
    return MockBuilder(YarnsheetCalculator);
  });

  it('should create', () => {
    const fixture = MockRender(YarnsheetCalculator);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
