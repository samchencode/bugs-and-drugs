import Stack from '@/Stack';

describe('Basic stack implementation', () => {
  let myStack: Stack<number>;

  beforeEach(() => {
    myStack = new Stack();
  });

  it('should start out empty', () => {
    expect(myStack.isEmpty()).toBe(true);
  });

  it('should store a value and not be empty', () => {
    myStack.push(1);
    expect(myStack.isEmpty()).toBe(false);
  });

  it('should return the last stored value with pop', () => {
    const value = 1;
    myStack.push(value);
    expect(myStack.pop()).toBe(value);
  });

  it('should throw an error if pop is called on an empty stack', () => {
    const test = () => myStack.pop();
    expect(test).toThrowError('cannot pop an empty stack');
  });

  it('should throw an error if pop is called twice on a stack of one element', () => {
    myStack.push(1);
    myStack.pop();
    const test = () => myStack.pop();
    expect(test).toThrowError('cannot pop an empty stack');
  });

  it('should return two pushed elements in reverse order using pop twice', () => {
    myStack.push(1);
    myStack.push(2);
    expect(myStack.pop()).toBe(2);
    expect(myStack.pop()).toBe(1);
  });
});
