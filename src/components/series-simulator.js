export default class Simulator {
  constructor(interval) {
    this.interval = interval;
  }

  update(frame) {
    const { player, updater, simulation } = frame;
    const { route } = player;
    const { last, current } = updater;
    const { startAt, simulatedTime } = player;
    const simulatedNow = startAt + simulatedTime;
    
    let distance = simulation.distance || 0;
    let avgDistance = simulation.avgDistance || 0;
    let speed = simulation.speed || 0;
    
    const a = 10 * 0.3; // m/s2
    let disDiff = 0;
    if(current && last && current.id !== last.id) {
      const lastDis = route.correct(last).distance;
      const currentDis = route.correct(current).distance;
      
      // 根据 current & last 的行进量和上报时间
      // 匀速推算当前模拟时间的理论行进量
      const avgSpeed = (currentDis - lastDis) / ((current.reportAt - last.reportAt) / 1000);
      avgDistance = lastDis + avgSpeed * ((simulatedNow - last.reportAt) / 1000);

      disDiff = avgDistance - distance;
    }

    const dt = this.interval / 1000;
    speed += Math.sign(disDiff) * a * dt;
    speed = Math.max(0, speed);
    console.log((speed * 3.6).toFixed(2))
    distance += speed * dt;
    
    simulation.speed = speed;
    simulation.distance = distance;
    simulation.point = route.pointAt(distance);
    simulation.avgDistance = avgDistance;
    simulation.avgPoint = route.pointAt(avgDistance);

    return frame;
  }
}
