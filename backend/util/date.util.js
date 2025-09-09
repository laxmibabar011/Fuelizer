import moment from 'moment';

// Central date helpers to standardize YYYY-MM-DD and now handling
export const DateUtil = {
  // ISO date string in tenant/station local timezone assumptions.
  today(format = 'YYYY-MM-DD') {
    return moment().format(format);
  },
  tomorrow(format = 'YYYY-MM-DD') {
    return moment().add(1, 'day').format(format);
  },
  nowDate() {
    return moment().toDate();
  },
  nowPlusMs(ms) {
    return moment().add(ms, 'milliseconds').toDate();
  },
  // Build a Date from today with hour:minute in local timezone
  todayAt(hour = 0, minute = 0) {
    return moment().hour(hour).minute(minute).second(0).millisecond(0).toDate();
  },
  isNowWithin(startTimeHHmm, endTimeHHmm) {
    const [sh, sm] = String(startTimeHHmm).split(':').map(Number);
    const [eh, em] = String(endTimeHHmm).split(':').map(Number);
    const now = moment();
    const start = moment().hour(sh || 0).minute(sm || 0).second(0).millisecond(0);
    const end = moment().hour(eh || 0).minute(em || 0).second(0).millisecond(0);
    // Handles typical same-day windows; cross-midnight requires explicit handling
    return now.isSameOrAfter(start) && now.isSameOrBefore(end);
  },
  // Compute if a shift crosses midnight (start > end) in HH:mm values
  crossesMidnight(startTimeHHmm, endTimeHHmm) {
    const [sh, sm] = String(startTimeHHmm).split(':').map(Number);
    const [eh, em] = String(endTimeHHmm).split(':').map(Number);
    const startMins = (sh || 0) * 60 + (sm || 0);
    const endMins = (eh || 0) * 60 + (em || 0);
    return endMins <= startMins;
  },
  // Decide effective assignment date: if within current shift window, return tomorrow, else today.
  // Handles cross-midnight windows (e.g., 22:00-06:00) by considering window spanning two days.
  managerEffectiveDate(startTimeHHmm, endTimeHHmm) {
    const [sh, sm] = String(startTimeHHmm).split(':').map(Number);
    const [eh, em] = String(endTimeHHmm).split(':').map(Number);
    const now = moment();
    const crosses = this.crossesMidnight(startTimeHHmm, endTimeHHmm);
    let inWindow = false;
    if (!crosses) {
      const start = moment().hour(sh || 0).minute(sm || 0).second(0).millisecond(0);
      const end = moment().hour(eh || 0).minute(em || 0).second(0).millisecond(0);
      inWindow = now.isSameOrAfter(start) && now.isSameOrBefore(end);
    } else {
      // Window splits across days: [start..23:59] OR [00:00..end]
      const start = moment().hour(sh || 0).minute(sm || 0).second(0).millisecond(0);
      const end = moment().hour(eh || 0).minute(em || 0).second(0).millisecond(0);
      const inLate = now.isSameOrAfter(start);
      const inEarly = now.isSameOrBefore(end);
      inWindow = inLate || inEarly;
    }
    return inWindow ? this.tomorrow() : this.today();
  }
};

export default DateUtil;

