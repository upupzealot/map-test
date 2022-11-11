export default class Simulator {
  constructor(interval) {
    this.interval = interval;
    this.simulatedCount = 0;
  }

  update({ series }, count) {
    this.simulatedCount++;
    const simulatedTime = this.simulatedCount * this.interval;
    const record = series.get(simulatedTime);
    return {
      series,
      point: {
        lng: record.lng,
        lat: record.lat,
      },
    }
  }
}
