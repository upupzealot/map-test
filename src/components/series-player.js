export default class Player {
  constructor() {
    this.series = null;
    this.totalTime = 0;
    this.startAt = 0;
    this.playTime = 0;
    this.isPlaying = false;
    this.simulatedTime = 0;
    this.frame = null;

    this.simulator = null;
    this.logicTimmer = null;
    this.graphicTimmer = null;
    this.render = null;
  }

  use(simulator, render) {
    this.simulator = simulator;
    this.render = render;
  }
  load(series) {
    this.series = series;
    this.totalTime = series.totalTime;

    this.reset();
  }

  start() {
    console.log('开始播放');
    let last = Date.now();
    this.logicTimmer = setInterval(() => {
      const now = Date.now();
      this.playTime += now - last;

      const { interval } = this.simulator;
      for(;this.simulatedTime + interval <= this.playTime;) {
        this.frame = this.simulator.update(this.frame, interval);
        this.simulatedTime += interval;
      }

      last = now;
    }, this.simulator.interval);

    this.graphicTimmer = setInterval(() => {
      this.render(this.frame);
    }, 100);
  }

  pause() {
    clearInterval(this.logicTimmer);
    this.logicTimmer = null;
    clearInterval(this.graphicTimmer);
    this.graphicTimmer = null;
  }

  reset() {
    this.startAt = 0;
    this.playTime = 0;
    this.isPlaying = false;
    if(this.timmer) {
      this.pause();
    }

    this.simulatedCount = 0;
    const p0 = this.series.get(0);
    this.frame = {
      series: this.series,
      playTime: 0,
      point: {
        lng: p0.lng,
        lat: p0.lat
      }
    };
  }
}