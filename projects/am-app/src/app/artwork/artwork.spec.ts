import { Artwork } from './artwork';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('Artwork', () => {
  beforeEach(() => {
    return MockBuilder(Artwork);
  });

  it('should create', () => {
    const fixture = MockRender(Artwork);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
