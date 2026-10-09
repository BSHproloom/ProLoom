import { MyTasks } from './my-tasks';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('MyTasks', () => {
  beforeEach(() => {
    return MockBuilder(MyTasks);
  });

  it('should create', () => {
    const fixture = MockRender(MyTasks);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
