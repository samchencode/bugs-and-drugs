import { Cell } from "./Cell";
import { LabelParams } from "./Table";

class TableInputValidator {
  rules: Rule[];

  constructor(rules: Rule[]) {
    this.rules = rules;
  }

  validate() {
    for (const rule of this.rules) {
      rule.check();
    }
  }
}

interface Rule {
  check(): void;
}

export default TableInputValidator;
export type { Rule };
