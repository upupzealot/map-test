import { wgs84togcj02 as Wgs84ToGcj02 } from 'coordtransform';

class Source {
  constructor({ filters, interval }) {
    this.interval = interval;
    this.filters = filters || [];
    this.last = null;
    this.current = null;
  }

  fetchFunc(time) {
    throw Error('需在子类中继承');
  }

  async init() {
    this.last = await this.fetchFunc(0);
    this.current = this.last;
  }

  async update(time) {
    const point = await this.fetchFunc(time);
    if(point.id !== this.current.id) {
      this.last = this.current;
      this.current = point;
    }
  }
}

class SeriesSource extends Source {
  constructor(opts) {
    super(opts);
    this.series = opts.series;
  }

  async fetchFunc(time) {
    const record = this.series.get(time);
    const [lng, lat] = Wgs84ToGcj02(record.lng, record.lat);
    return {
      ...record,
      lng, lat
    }
  }
}

class RealTimeSource extends Source {
  constructor(opts) {
    super(opts);
    this.fetchFunc = opts.fetchFunc;
  }
}

export { SeriesSource, RealTimeSource }
