export default class AmapRender {
  constructor({ AMap, map, icon, interval, debug }) {
    this.AMap = AMap;
    this.map = map;
    this.icon = icon;
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
    this.imgEle = null;
    this.noteEle = null;
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
          const imgEle = document.createElement('img');
          imgEle.setAttribute('src', this.icon.url);
          imgEle.setAttribute('width', this.icon.width || 50);
          imgEle.setAttribute('height', this.icon.height || 50);
          imgEle.setAttribute('style', 'transition: all .5s;')
          this.imgEle = imgEle;
          const noteEle = document.createElement('div');
          noteEle.innerHTML = '<span>隧道行驶中，无 GPS 信号...</span>'
          noteEle.setAttribute('style', `
            width: 200px;
            position: absolute;
            left: -75px;
            top: -20px;
          
            background-color: rgba(0, 0, 0, .6);
            color: white;
            border-radius: 4px;
            text-align: center;
          `)
          this.noteEle = noteEle;
          const divEle = document.createElement('div');
          divEle.setAttribute('style', 'transform: translate(0, 25px)');
          divEle.append(noteEle);
          divEle.append(imgEle);
          this.simulationMarker.setContent(divEle);
        }
        
        map.add(this.simulationMarker);
        this.simulationMarker.on('click', () => {
          this.lockCamera = true;
        });
      }
      // 图片图标：旋转
      if(!debug && this.icon) {
        const degree = frame.simulation.point.directionInDegree;
        this.imgEle.setAttribute('style', `transform: rotate(${this.icon.rotation - degree}deg);`);
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

      // 隧道形式提示开关
      if(frame.tunnelTipVisible) {
        this.noteEle.removeAttribute('hidden');
      } else {
        this.noteEle.setAttribute('hidden', 'hidden');
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
