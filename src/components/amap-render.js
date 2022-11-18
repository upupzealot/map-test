export default class AmapRender {
  constructor({ AMap, map, icon, rotateIcon, interval, debug }) {
    this.AMap = AMap;
    this.map = map;
    this.icon = icon;
    this.rotateIcon = rotateIcon;
    this.interval = interval;
    this.debug = debug;

    this.lockCamera = true;
    map.on('dragstart', ({ target }) => {
      if(target === this.map) {
        this.lockCamera = false;
      }
    });

    this.gpsMarker = null;
    this.avgMarker = null;
    this.simulationMarker = null;
  }

  render(frame) {
    const { AMap, map, debug } = this;
    const { source: { current } } = frame.ctx;
    if(current && debug) {
      const gpsPos = new AMap.LngLat(current.lng, current.lat);
      if(!this.gpsMarker) {
        this.gpsMarker = this.creatMarker('green', gpsPos);
        map.add(this.gpsMarker);
      }
      this.gpsMarker.setCenter(gpsPos);
    }
    
    const { point, avgPoint } = frame.simulation;
    if(avgPoint && debug) {
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
        if(debug) {
          // 圆点图标
          this.simulationMarker = this.creatMarker('blue', simulatePos);
        } else {
          // 图片图标
          this.simulationMarker = new AMap.Marker({
            position: simulatePos, 
            setzIndex: 6,
          });
          this.simulationMarker.setContent(this.icon);
        }
        
        map.add(this.simulationMarker);
        this.simulationMarker.on('click', () => {
          this.lockCamera = true;
        });
      }
      // 图片图标：旋转
      if(!debug && this.icon && this.rotateIcon) {
        this.rotateIcon(frame.simulation.point.directionInDegree);
      }
      // 平移
      if(debug) {
        this.simulationMarker.setCenter(simulatePos);
      } else {
        this.simulationMarker.setPosition(simulatePos);
      }
      
      // 镜头跟随
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
