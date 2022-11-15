export default class Simulator {
  constructor(interval) {
    this.interval = interval;
  }

  update(frame) {
    const { ctx: { player, source }, simulation } = frame;
    const { route } = player;
    const { current, history } = source;
    const { startAt, simulatedTime } = player;
    const simulatedNow = startAt + simulatedTime;
    
    let distance = simulation.distance || 0;
    let avgDistance = simulation.avgDistance || 0;
    let speed = simulation.speed || 0;
    
    let last = null;
    for (let i = 0; i < history.length; i++) {
      const his = history[i];
      if(current.reportAt - his.reportAt >= 10 * 1000) {
        if(i === 0) {
          last = his;
        } else {
          last = history[i - 1];
        }
      }
    }
    let disDiff = 0;
    let avgSpeed = 0;
    if(current && last && current.id !== last.id) {
      const lastDis = route.correct(last).distance;
      const currentDis = route.correct(current).distance;
      
      // 根据 current & last 的行进量和上报时间
      // 匀速推算当前模拟时间的理论行进量
      avgSpeed = (currentDis - lastDis) / ((current.reportAt - last.reportAt) / 1000);
      avgDistance = lastDis + avgSpeed * ((simulatedNow - last.reportAt) / 1000);

      disDiff = avgDistance - distance;
    }

    const dt = this.interval / 1000;
    const maxA = (60 / 3.6) / 6; // m/s2

    // 弹簧模型
    // let a = Math.abs(disDiff / 100 * maxA);
    // if(disDiff < 0) {
    //   a = Math.min(a, maxA * 2);
    // } else {
    //   a = Math.min(a, maxA);
    // }
    // speed += Math.sign(disDiff) * a * dt;

    // 合流模型
    const predict = 8;
    const predictedSpeed = (avgSpeed * predict + disDiff) / predict;
    const disSpeed = predictedSpeed - speed;
    speed += Math.sign(disSpeed) * maxA * dt;

    speed = Math.max(0, speed);
    speed = Math.min(speed, (120 / 3.6));
    
    distance += speed * dt;
    console.log((speed * 3.6).toFixed(2), disDiff.toFixed(2));
    
    simulation.speed = speed;
    simulation.distance = distance;
    simulation.point = route.pointAt(distance);
    simulation.avgDistance = avgDistance;
    simulation.avgPoint = route.pointAt(avgDistance);

    return frame;
  }
}
