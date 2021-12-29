import type { Rule } from './Rule';

function validate(rules: Rule[]) {
  for (const rule of rules) {
    rule.check();
  }
}

export default validate;
