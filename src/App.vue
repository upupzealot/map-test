<template>
  <div id="app">
    <div id="mapRoot" style="width: 800px; height: 400px; float: left; margin-right: 10px;" />
    <PlayBar
      @start="()=>{ player && player.start() }"
      @pause="()=>{ player && player.pause() }"
      @stop="()=>{ player && player.reset() }"
    />
  </div>
</template>

<style>
.amap-logo,
.amap-copyright {
  opacity: 0;
}
</style>

<script>
import PlayBar from './components/playbar'

// import { wgs84togcj02 as Wgs84ToGcj02 } from 'coordtransform';
import amapConf from './amap.config.json'

import Route from 'route-correction'
import routePoints from './data/route-points.json'
import GpsSeries from './components/gps-series.js'
import gpsPoints from './data/gps-points.json'
import GpsSource from './components/gps-source.js'
import SeriesSimulator from './components/series-simulator.js'
import SeriesPlayer from './components/series-player.js'

let map = null;

export default {
  name: 'App',
  components: { PlayBar },
  data() {
    return {
      scriptLoaded: false,
      map: null,
      route: null,
      player: null,
    }
  },
  async created() {
    this.route = new Route(routePoints);
    const player = new SeriesPlayer();

    const gpsSeries = new GpsSeries(gpsPoints);
    const source = new GpsSource(gpsSeries, 1000);

    const simulator = new SeriesSimulator(50);
    let gpsMarker = null;
    let avgMarker = null;
    let simulationMarker = null;
    const render = function(frame) {
      const { current } = frame.source;
      if(current) {
        const gpsPos = new AMap.LngLat(current.lng, current.lat);
        if(!gpsMarker) {
          gpsMarker = new AMap.CircleMarker({
            center: gpsPos,
            radius: 2,
            strokeColor: 'green',
            fillColor: 'green',
          });
          map.add(gpsMarker);
        }
        gpsMarker.setCenter(gpsPos);
      }
      
      const { point, avgPoint } = frame.simulation;
      if(avgPoint) {
        const avgPos = new AMap.LngLat(avgPoint.lng, avgPoint.lat);
        if(!avgMarker) {
          avgMarker = new AMap.CircleMarker({
            center: avgPos,
            radius: 2,
            strokeColor: 'yellow',
            fillColor: 'yellow',
          });
          map.add(avgMarker);
        }
        avgMarker.setCenter(avgPos);
      }
      if(point) {
        const simulatePos = new AMap.LngLat(point.lng, point.lat);
        if(!simulationMarker) {
          simulationMarker = new AMap.CircleMarker({
            center: simulatePos,
            radius: 2,
            strokeColor: 'blue',
            fillColor: 'blue',
          });
          map.add(simulationMarker);
        }
        simulationMarker.setCenter(simulatePos);
        map.setCenter(simulatePos, true);
      }
    }

    await player.init({
      route: this.route,
      source,
      render,
      simulator
    });
    this.player = player;
  },
  async mounted() {
    await this.loadMapScript();
    await this.loadRoute();
    
    await this.initClickCorrection();
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
  }
}
</script>
