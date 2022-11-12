export default class AmapRender {
  constructor(AMap, map, interval) {
    this.AMap = AMap;
    this.map = map;
    this.interval = interval;

    this.gpsMarker = null;
    this.avgMarker = null;
    this.simulationMarker = null;
  }

  render(frame) {
    const { AMap, map } = this;
    const { current } = frame.source;
    if(current) {
      const gpsPos = new AMap.LngLat(current.lng, current.lat);
      if(!this.gpsMarker) {
        this.gpsMarker = this.creatMarker('green', gpsPos);
        map.add(this.gpsMarker);
      }
      this.gpsMarker.setCenter(gpsPos);
    }
    
    const { point, avgPoint } = frame.simulation;
    if(avgPoint) {
      const avgPos = new AMap.LngLat(avgPoint.lng, avgPoint.lat);
      if(!this.avgMarker) {
        this.avgMarker = this.creatMarker('yellow', avgPos);
        map.add(this.avgMarker);
      }
      this.avgMarker.setCenter(avgPos);
    }
    if(point) {
      const simulatePos = new AMap.LngLat(point.lng, point.lat);
      if(!this.simulationMarker) {
        this.simulationMarker = this.creatMarker('blue', simulatePos);
        map.add(this.simulationMarker);
      }
      this.simulationMarker.setCenter(simulatePos);
      map.setCenter(simulatePos, true);
    }
  }

  creatMarker(color, position) {
    const marker = new AMap.CircleMarker({
      center: position,
      radius: 4,
      strokeColor: color,
      fillColor: color,
    });
    return marker;
  }
}
