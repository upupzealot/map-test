class Trigger {
  constructor(callback) {
    this.callback = callback;
  }

  test(simulation) {
    throw Error('需在子类中继承');
  }
}

export class DistanceTrigger extends Trigger {
  constructor(distance, callback) {
    super(callback);
    this.distance = distance;
  }

  test(simulation) {
    const { distance, lastDistance } = simulation;
    return lastDistance < this.distance && distance > this.distance;
  }
}
