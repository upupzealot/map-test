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
    this.source = null;
    this.render = null;
    this.simulator = null;
    this.logicTimmer = null;
    this.graphicTimmer = null;
  }

  async init({
      route,
      source,
      render,
      simulator }) {
    this.route = route;
    this.source = source;
    this.simulator = simulator;
    this.render = render;

    await this.source.init();
    await this.reset();
  }

  start() {
    console.log('开始播放');
    let last = Date.now();
    let sourceTime = 0;
    this.logicTimmer = setInterval(async () => {
      const now = Date.now();
      const dt = now - last;
      this.playTime += dt

      // 更新 source
      sourceTime += dt;
      if(sourceTime >= this.source.interval) {
        sourceTime -= this.source.interval;
        await this.source.update(this.playTime);
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
      this.render.render(this.frame);
    }, this.render.interval);
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
    if(this.logicTimmer) {
      this.pause();
    }
    this.simulatedTime = 0;

    this.startAt = this.source.series.startAt;

    const p0 = this.source.current;
    this.frame = {
      ctx: {
        player: this,
        source: this.source,
      },
      simulation: {
        point: {
          lng: p0.lng,
          lat: p0.lat,
        }
      },
    };
  }
}