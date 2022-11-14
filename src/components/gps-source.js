import { wgs84togcj02 as Wgs84ToGcj02 } from 'coordtransform';

class Source {
  constructor({ filters, interval }) {
    this.interval = interval;
    this.filters = filters || [];
    this.current = null;
    this.history = [];
  }

  fetchFunc(time) {
    throw Error('需在子类中继承');
  }

  async init() {
    this.current = await this.fetchFunc(0);
    this.history = [];
  }

  async update(time) {
    const point = await this.fetchFunc(time);
    let pass = true;
    for (let i = 0; i < this.filters.length; i++) {
      const filter = this.filters[i];
      pass = pass && filter.filter(point, this);
      if(!pass) break;
    }
    if(pass) {
      this.history.unshift(this.current);
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
