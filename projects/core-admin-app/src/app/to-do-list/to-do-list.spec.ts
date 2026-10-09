import { ToDoList } from './to-do-list';
import { MockBuilder, MockRender } from 'ng-mocks';

describe('ToDoList', () => {
  beforeEach(() => {
    return MockBuilder(ToDoList);
  });

  it('should create', () => {
    const fixture = MockRender(ToDoList);
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
