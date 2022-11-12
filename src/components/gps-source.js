import { wgs84togcj02 as Wgs84ToGcj02 } from 'coordtransform';

export default class Source {
  constructor(series, interval) {
    this.series = series;
    this.interval = interval;
    this.last = null;
    this.current = null;
  }

  fetchFunc(time) {
    const record = this.series.get(time);
    const [lng, lat] = Wgs84ToGcj02(record.lng, record.lat);
    return {
      ...record,
      lng, lat
    }
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

    return point;
  }
}