// 播放器
import TripPlayer from './trip-player'

// 路线
import Route from 'route-correction'

// GPS 数据源
// 1.SeriesSource：（已录制的）GPS 序列作为数据源
// 2.RealTimeSource：实时 GPS 上报
import { SeriesSource, RealTimeSource } from './gps-source'
// GPS 上报序列，被 SeriesSource 所使用
import GpsSeries from './gps-series'
// GPS 上报点位过滤器
import RangeFilter from './range-filter'

// 运动模拟器
import MoveSimulator from './move-simulator'

// 触发器
// 1.距离触发器
import { DistanceTrigger } from './trigger'

export default class Player {
  static Route = Route;
  static SeriesSource = SeriesSource;
  static GpsSeries = GpsSeries;
  static RealTimeSource = RealTimeSource;
  static RangeFilter = RangeFilter;
  static MoveSimulator = MoveSimulator;
  static DistanceTrigger = DistanceTrigger;

  constructor() {
    this.series = null;
    this.startAt = 0;
    this.playTime = 0;
    this.isPlaying = false;
    this.simulatedTime = 0;
    this.frame = null;

    this.route = null;
    this.source = null;
    this.triggers = [];
    this.render = null;
    this.simulator = null;
    this.logicTimmer = null;
    this.graphicTimmer = null;

    this.listeners = {};
  }

  async init({
      route,
      source,
      triggers,
      render,
      simulator }) {
    this.route = route;
    this.source = source;
    this.triggers = triggers;
    this.simulator = simulator;
    this.render = render;

    await this.source.init();
    await this.reset();
  }

  on(topic, callback) {
    if(callback) {
      if(!this.listeners[topic]) {
        this.listeners[topic] = [];
      }

      this.listeners[topic].push(callback);
    }
  }

  async emit(topic, value) {
    const listeners = this.listeners[topic];
    listeners.forEach(async listener => {
      await listener(value);
    });
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

      // 更新 triggers
      this.triggers.forEach(trigger => {
        const triggered = trigger.test(this.frame.simulation);
        if(triggered) {
          trigger.callback();
        }
      });

      last = now;
    }, this.simulator.interval);

    // 更新图像
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
