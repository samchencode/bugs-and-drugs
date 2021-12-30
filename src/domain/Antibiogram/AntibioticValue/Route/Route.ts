import type ValueObject from '@/domain/base/ValueObject';

interface Route extends ValueObject {
  toString(): string;
}

export type { Route };
