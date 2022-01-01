import ValueObject from '@/domain/base/ValueObject';

abstract class SettingValue extends ValueObject {
  abstract toString(): string;
}

export default SettingValue;
