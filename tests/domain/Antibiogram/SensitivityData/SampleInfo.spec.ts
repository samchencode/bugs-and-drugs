import SampleInfo from '@/domain/Antibiogram/SampleInfo';
import SampleInfoItem from '@/domain/Antibiogram/SampleInfo/SampleInfoItem';

describe('SampleInfo', () => {
  class DemoInfo extends SampleInfoItem {
    readonly type: string = 'demo-datum';
    value: string;

    constructor(value: string) {
      super();
      this.value = value;
    }

    toString(): string {
      return this.value;
    }

    protected isIdentical(v: DemoInfo): boolean {
      return v.value === this.value;
    }
  }

  class DemoInfo2 extends SampleInfoItem {
    readonly type: string = 'demo-datum-2';
    value: string;

    constructor(value: string) {
      super();
      this.value = value;
    }

    toString(): string {
      return this.value;
    }

    protected isIdentical(v: DemoInfo2): boolean {
      return v.value === this.value;
    }
  }

  it('should create new SampleInfo with no facts', () => {
    const info = new SampleInfo([]);
    expect(info).toBeDefined();
  });

  it('should return all infoitems as map', () => {
    const infoItem1 = new DemoInfo('1');
    const info = new SampleInfo([infoItem1]);
    const map = info.getItems();
    expect(map.get(infoItem1.type)).toBe(infoItem1);
  });

  it('should create sample info with different infoitems', () => {
    const infoItem1 = new DemoInfo('1');
    const infoItem2 = new DemoInfo2('2');
    const info = new SampleInfo([infoItem1, infoItem2]);

    expect(info.getItem(infoItem1.type)?.is(new DemoInfo('1'))).toBe(true);
    expect(info.getItem(infoItem2.type)?.is(new DemoInfo2('2'))).toBe(true);
  });

  it('should equate two info objects only if they have identical items', () => {
    const info = new SampleInfo([new DemoInfo('1'), new DemoInfo2('2')]);
    const info2 = new SampleInfo([new DemoInfo('1'), new DemoInfo2('2')]);
    expect(info.is(info2)).toBe(true);
  });

  it('should not equate two info objects if they do not have identical items', () => {
    const info = new SampleInfo([new DemoInfo('1'), new DemoInfo2('2')]);
    const info3 = new SampleInfo([new DemoInfo('1')]);
    expect(info.is(info3)).toBe(false);
  });

  it('should check whether it has a certain item-value combo', () => {
    const info = new SampleInfo([new DemoInfo('1'), new DemoInfo2('2')]);
    expect(info.hasItem(new DemoInfo('1'))).toBe(true);
    expect(info.hasItem(new DemoInfo('2'))).toBe(false);
    expect(info.hasItem(new DemoInfo2('1'))).toBe(false);
  });

  it('should get item by constructor', () => {
    const infoItem1 = new DemoInfo('1');
    const infoItem2 = new DemoInfo2('2');
    const info = new SampleInfo([infoItem1, infoItem2]);

    expect(info.getItem(DemoInfo)?.is(new DemoInfo('1'))).toBe(true);
    expect(info.getItem(DemoInfo2)?.is(new DemoInfo2('2'))).toBe(true);
  });

  it('should intersect items between two sampleInfo', () => {
    const infoItem1 = new DemoInfo('1');
    const infoItem2 = new DemoInfo2('2');
    const infoItem3 = new DemoInfo2('3');
    const info1 = new SampleInfo([infoItem1, infoItem2]);
    const info2 = new SampleInfo([infoItem1, infoItem3]);

    const result = info1.intersect(info2);
    expect(result.is(new SampleInfo([infoItem1]))).toBe(true);
  });

  it('should subtract items between two sampleInfo', () => {
    const infoItem1 = new DemoInfo('1');
    const infoItem2 = new DemoInfo2('2');
    const infoItem3 = new DemoInfo2('3');
    const info1 = new SampleInfo([infoItem1, infoItem2]);
    const info2 = new SampleInfo([infoItem1, infoItem3]);

    const result = info1.subtract(info2);
    expect(result.is(new SampleInfo([infoItem2]))).toBe(true);
  });
});
