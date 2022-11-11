export default class Series {
  constructor(records) {
    this.records = [];
    
    if(!records || !records.length) return;
    this.records = records.map((r, index) => {
      return {
        id: index + 1,
        ...r,
        reportAt: (new Date(r.reportAt)).valueOf(),
        updateAt: (new Date(r.updateAt)).valueOf(),
      }
    });
    const first = this.records[0];
    this.startAt = this.records[0].reportAt;
    const last = this.records[this.records.length - 1];
    this.totalTime = last.reportAt - this.realStartAt;
  }

  get(time) {
    if(time >= this.totalTime) {
      time = this.totalTime;
      const last = this.records[this.records.length - 1];
      this.current = last;
      return this.current;
    }

    for (let i = 1; i < this.records.length; i++) {
      const record = this.records[i];
      if(record.reportAt - this.startAt > time) {
        this.index = i - 1;
        this.current = this.records[i - 1];
        break;
      }
    }
    return this.current;
  }
}
