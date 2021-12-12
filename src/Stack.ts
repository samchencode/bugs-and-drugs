class Stack<T> {
  #counter: number = 0;
  #elements: T[] = [];

  isEmpty() {
    return this.#counter == 0;
  }

  push(value: T) {
    this.#elements[this.#counter] = value;
    this.#counter++;
  }

  pop() {
    if (this.isEmpty()) throw new Error('cannot pop an empty stack');
    this.#counter--;
    const result = this.#elements[this.#counter];
    delete this.#elements[this.#counter];
    return result;
  }
}

export default Stack;