<template>
  <div id="app">
    <div id="mapRoot" style="width: 800px; height: 400px; float: left; margin-right: 10px;" />
    <PlayBar
      @start="()=>{ player && player.start() }"
      @pause="()=>{ player && player.pause() }"
      @stop="()=>{ player && player.reset() }"
    />
    <img :src="iconUrl" width="50" height="50" />
  </div>
</template>

<style>
.amap-logo,
.amap-copyright {
  opacity: 0;
}

.marker-content {
  transform: translate(0, 25px);
}
.marker-content img {
  transition: all .5s;
}
.marker-content .note{
  width: 200px;
  position: absolute;
  left: -75px; /* 100px / 2 - 50px / 2 = 75px */
  top: -20px;

  background-color: rgba(0, 0, 0, .6);
  color: white;
  border-radius: 4px;
  text-align: center;
}
.marker-content .note.show  {
  display: block;
}
.marker-content .note.hide  {
  display: none;
}
</style>

<script>
import PlayBar from './components/playbar'
import iconUrl from './assets/police-car.png'

// import { wgs84togcj02 as Wgs84ToGcj02 } from 'coordtransform';
import amapConf from './amap.config.json'

import Route from 'route-correction'
import routePoints from './data/route-points.json'
import tunnels from './data/tunnels.json'
import GpsSeries from './components/gps-series.js'
import GpsFilter from './components/gps-filter.js'
import gpsPoints from './data/gps-points.json'
import { SeriesSource } from './components/gps-source.js'
import { DistanceTrigger } from './components/trigger.js'
import MoveSimulator from './components/move-simulator.js'
import AmapRender from './components/amap-render.js'
import TripPlayer from './components/trip-player.js'

let map = null;

export default {
  name: 'App',
  components: { PlayBar },
  data() {
    return {
      iconUrl,
      scriptLoaded: false,
      map: null,
      route: null,
      tunnels: [],
      player: null,
    }
  },
  async mounted() {
    await this.loadMapScript();
    await this.loadRoute();
    await this.loadTunnels();
    
    await this.initClickCorrection();

    await this.initPlayer();
  },
  beforeDestroy() {
    this.player.pause();
  },
  methods: {
    // 异步加载地图所需 script
    async loadMapScript() {
      const src = `https://webapi.amap.com/maps?v=2.0`
        + `&key=${amapConf.key}&callback=AMapInit`;
      if (!document.querySelector('script[src="' + src + '"]')) {
        const script1 = document.createElement('script');
        script1.innerHTML = `window._AMapSecurityConfig = {
          securityJsCode: '${amapConf.secret}',
        }`;
        document.head.appendChild(script1);
        
        await new Promise(resolve => {
          window.AMapInit = () => {
            this.scriptLoaded = true;
            resolve();
          }

          const script2 = document.createElement('script');
          script2.src = src;
          document.head.appendChild(script2);
        });
      } else {
        this.scriptLoaded = true;
      }
    },
    async loadRoute() {
      const t0 = Date.now();
      this.route = new Route(routePoints);
      this.route.setDistanceFunc((p0, p1) => {
        return AMap.GeometryUtil.distance([p0.lng, p0.lat], [p1.lng, p1.lat]);
      });
      const linePoints = this.route.points.map(p => new AMap.LngLat(p.lng, p.lat))
      const line = new AMap.Polyline({
        path: linePoints,  
        strokeWeight: 3,     // 线条宽度，默认为 1
        strokeColor: 'grey', // 线条颜色
        strokeOpacity: 1,    // 线条透明度
        lineJoin: 'round',   // 折线拐点连接处样式
      });

      map = new AMap.Map('mapRoot');
      map.add(line);
      map.setFitView(); // 视野自适应
      console.log(`加载路线耗时：${Date.now() - t0} ms`, )
    },
    async loadTunnels() {
      for (let i = 0; i < tunnels.length; i++) {
        let { start, end } = tunnels[i];
        const corrections = [start, end].map(point => {
          return this.route.correct(point);
        }).sort((c0, c1) => {
          return c0.distance - c1.distance;
        });
        
        const [startCorrection, endCorrection] = corrections;
        const { segments } = this.route;
        let tunnelPath = [];
        for (let i = startCorrection.index; i < endCorrection.index; i++) {
          tunnelPath.push(segments[i].p1);
        }
        tunnelPath = [
          startCorrection.point,
          ...tunnelPath,
          endCorrection.point,
        ];
        const tunnelPoints = tunnelPath.map(p => new AMap.LngLat(p.lng, p.lat));
        this.tunnels.push({
          start: startCorrection,
          end: endCorrection,
          points: tunnelPoints,
        });

        const tunnelLine = new AMap.Polyline({
          path: tunnelPoints,  
          strokeWeight: 10,    // 线条宽度，默认为 1
          strokeColor: '#00B2D5', // 线条颜色
          strokeOpacity: .5,   // 线条透明度
          lineJoin: 'round',   // 折线拐点连接处样式
          lineCap: 'round',    // 折线两端线帽的绘制样式
        });
        map.add(tunnelLine);
      }
    },
    async initClickCorrection() {
      let correctedPoint = null;
      let line2CorrectedPoint = null;

      map.on('click', e => {
        if(!correctedPoint) {
          correctedPoint = new AMap.CircleMarker({
            center: e.lnglat,
            radius: 2,
            strokeColor: 'red',
            fillColor: 'red',
          });
          map.add(correctedPoint);

          line2CorrectedPoint = new AMap.Polyline({
              path: [e.lnglat, e.lnglat],  
              strokeWeight: 1,    // 线条宽度，默认为 1
              strokeColor: 'red', // 线条颜色
              lineJoin: 'round',  // 折线拐点连接处样式
          });
          map.add(line2CorrectedPoint);
        }

        correctedPoint.setCenter(e.lnglat);
        const t0 = Date.now();
        const nearestRes = this.route.correct(e.lnglat);
        console.log(`纠偏耗时：${Date.now() - t0} ms`, nearestRes)
        const nearestPoint = new AMap.LngLat(nearestRes.point.lng, nearestRes.point.lat); 
        line2CorrectedPoint.setPath([e.lnglat, nearestPoint]);
      });
    },
    async initPlayer() {
      // 初始化 GPS 源
      const gpsSeries = new GpsSeries(gpsPoints);
      const gpsFilter = new GpsFilter({
        range: 15,
        ctx: { route: this.route },
      });
      const source = new SeriesSource({
        series: gpsSeries,
        filters: [gpsFilter],
        interval: 1000,
      });
      // 初始化模拟器
      const simulator = new MoveSimulator(50);
      // 初始化渲染器
      const imgEle = document.createElement('img');
      imgEle.setAttribute('src', this.iconUrl);
      imgEle.setAttribute('width', 50);
      imgEle.setAttribute('height', 50);
      const noteEle = document.createElement('div');
      noteEle.setAttribute('class', 'note hide');
      noteEle.innerHTML = '<span>隧道行驶中，无 GPS 信号...</span>'
      const divEle = document.createElement('div');
      divEle.setAttribute('class', 'marker-content');
      divEle.append(noteEle);
      divEle.append(imgEle);
      const render = new AmapRender({
        AMap, map,
        icon: divEle,
        interval: 60,
      });
      // 初始化触发器
      let triggers = [];
      this.tunnels.forEach(tunnel => {
        triggers.push(new DistanceTrigger(tunnel.start.distance, ()=>{
          noteEle.setAttribute('class', 'note show');
        }));
        triggers.push(new DistanceTrigger(tunnel.end.distance, ()=>{
          noteEle.setAttribute('class', 'note hide');
        }));
      })

      // 初始化播放器
      const player = new TripPlayer();
      // 播放器加载各模块
      await player.init({
        route: this.route,
        source,
        triggers,
        render,
        simulator
      });
      this.player = player;
    }
  }
}
</script>
