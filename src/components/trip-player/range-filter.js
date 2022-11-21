export default class RangeFilter {
  constructor({ range, ctx }) {
    this.range = range || 0;
    this.route = ctx.route;
  }

  filter(point, source) {
    const { current } = source;
    const distance = this.route.distanceBetween(point, current);
    return point.id !== current.id && distance >= this.range;
  }
}
