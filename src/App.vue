<template>
  <div id="app">
    <div id="mapRoot" style="width: 800px; height: 400px;" />
  </div>
</template>

<style>
.amap-logo,
.amap-copyright {
  opacity: 0;
}
</style>

<script>
import amapConf from './amap.config.json'
import points from './points.json'
import Route from 'route-correction'

let map = null;
let point = null;
let nearest = null;
let line2nearest = null;

export default {
  name: 'App',
  data() {
    return {
      scriptLoaded: false,
      map: null,
      path: null,
    }
  },
  async mounted() {
    await this.loadMapScript();

    const t0 = Date.now();
    const path = new Route(points, {
      // distanceFunc: (p0, p1) => {
      //   return AMap.GeometryUtil.distance([p0.lng, p0.lat], [p1.lng, p1.lat]);
      // }
    });
    console.log(`加载路线耗时：${Date.now() - t0} ms`, )

    const linePoints = path.points.map(p => new AMap.LngLat(p.lng, p.lat))
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

    map.on('click', e => {
      if(!point) {
        point = new AMap.CircleMarker({
          center: e.lnglat,
          radius: 1,
          strokeColor: 'red',
          fillColor: 'red',
        });
        map.add(point);

        const t0 = Date.now();
        const nearestRes = path.nearestBy(e.lnglat);
        console.log(`计算耗时 ${Date.now() - t0} ms`, nearestRes)
        const nearestPoint = new AMap.LngLat(nearestRes.point.lng, nearestRes.point.lat); 
        line2nearest = new AMap.Polyline({
            path: [e.lnglat, nearestPoint],  
            strokeWeight: 1,    // 线条宽度，默认为 1
            strokeColor: 'red', // 线条颜色
            lineJoin: 'round',  // 折线拐点连接处样式
        });
        map.add(line2nearest);
      } else {
        point.setCenter(e.lnglat);
        const t0 = Date.now();
        const nearestRes = path.nearestBy(e.lnglat);
        console.log(`纠偏耗时：${Date.now() - t0} ms`, nearestRes)
        const nearestPoint = new AMap.LngLat(nearestRes.point.lng, nearestRes.point.lat); 
        line2nearest.setPath([e.lnglat, nearestPoint]);
      }
    });
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
    }
  }
}
</script>
