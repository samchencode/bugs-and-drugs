import type { Rule } from './Rule';

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

export default TableInputValidator;
