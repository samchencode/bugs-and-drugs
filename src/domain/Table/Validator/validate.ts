import type { Rule } from '@/domain/Table/Validator/Rule';

function validate(rules: Rule[]) {
  for (const rule of rules) {
    rule.check();
  }
}

export default validate;
