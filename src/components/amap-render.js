export default class AmapRender {
  constructor({ AMap, map, icon, interval }) {
    this.AMap = AMap;
    this.map = map;
    this.icon = icon;
    this.interval = interval;

    let pressed = false;
    this.lockCamera = true;
    map.on('mousedown', ({ target }) => {
      if(target === this.map) {
        pressed = true;
      }
    });
    map.on('mousemove', () => {
      if(pressed) {
        this.lockCamera = false;
      }
    });
    map.on('mouseup', ({ target }) => {
      if(target === this.map) {
        pressed = false;
      }
    });

    this.gpsMarker = null;
    this.avgMarker = null;
    this.simulationMarker = null;
  }

  render(frame) {
    const { AMap, map } = this;
    const { source: { current } } = frame.ctx;
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
        // 图片图标
        this.simulationMarker = new AMap.Marker({
          position: simulatePos, 
          setzIndex: 6,
        });
        this.simulationMarker.setContent(this.icon);
        // 圆点图标
        // this.simulationMarker = this.creatMarker('blue', simulatePos);
        map.add(this.simulationMarker);
        this.simulationMarker.on('click', () => {
          this.lockCamera = true;
        });
      }
      // 图片图标
      this.simulationMarker.setAngle(360 - frame.simulation.point.directionInDegree)
      this.simulationMarker.setPosition(simulatePos);
      // 圆点图标
      // this.simulationMarker.setCenter(simulatePos);
      if(this.lockCamera) {
        map.setCenter(simulatePos, true);
      }
    }
  }

  creatMarker(color, position) {
    const marker = new this.AMap.CircleMarker({
      center: position,
      radius: 4,
      strokeColor: color,
      fillColor: color,
    });
    return marker;
  }
}
