import { Cell } from "./Cell";

class TableInputValidator {
  rules: Rule[];

  constructor(rules: Rule[]) {
    this.rules = rules;
  }

  validate(input: Cell<unknown>[][]) {
    for (const rule of this.rules) {
      rule.check(input);
    }
  }
}

interface Rule {
  check(input: Cell<unknown>[][]): void;
}

export default TableInputValidator;
export type { Rule };
