import MetadataValue from '@/domain/Antibiogram/Metadata/MetadataValue';
import type ResistanceRate from '@/domain/Antibiogram/Metadata/ResistanceRate';

class NullMetadataValue extends MetadataValue {
  static readonly slug = 'null-metadata-value';

  getSlug() {
    return NullMetadataValue.slug;
  }
  isNull(): boolean {
    return true;
  }
  getValue(): string[] {
    return [];
  }
  getResistanceRates(): ResistanceRate[] {
    return [];
  }
  protected isIdentical(): boolean {
    return true;
  }
}

export default NullMetadataValue;
