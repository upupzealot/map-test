export default class Player {
  constructor() {
    this.series = null;
    this.totalTime = 0;
    this.startAt = 0;
    this.playTime = 0;
    this.isPlaying = false;
    this.simulatedTime = 0;
    this.frame = null;

    this.route = null;
    this.updater = null;
    this.render = null;
    this.simulator = null;
    this.logicTimmer = null;
    this.graphicTimmer = null;
  }

  async init({
      route,
      updater,
      render,
      simulator }) {
    this.route = route;
    this.updater = updater;
    this.simulator = simulator;
    this.render = render;

    await this.updater.init();
    await this.reset();
  }

  start() {
    console.log('开始播放');
    let last = Date.now();
    let updateTime = 0;
    this.logicTimmer = setInterval(async () => {
      const now = Date.now();
      const dt = now - last;
      this.playTime += dt

      // 更新 updater
      updateTime += dt;
      if(updateTime >= this.updater.interval) {
        updateTime -= this.updater.interval;
        await this.updater.update(this.playTime);
      }

      // 更新 simulator
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
    this.playTime = 0;
    this.isPlaying = false;
    if(this.timmer) {
      this.pause();
    }

    this.startAt = this.updater.series.startAt;

    const p0 = this.updater.current;
    this.frame = {
      player: this,
      updater: this.updater,
      simulation: {
        time: 0,
        point: {
          lng: p0.lng,
          lat: p0.lat,
        }
      },
    };
  }
}