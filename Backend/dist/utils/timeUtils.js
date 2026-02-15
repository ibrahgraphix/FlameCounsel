"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTimeSlots = generateTimeSlots;
// @ts-ignore: avoid missing declaration file for luxon in environments where @types/luxon isn't installed
const luxon_1 = require("luxon");
/**
 * Generate time slots for a given date (YYYY-MM-DD) in timezone, excluding busyRanges.
 * Returns array of { startISO, endISO, label }.
 */
function generateTimeSlots(dateISO, workingStart, workingEnd, durationMinutes, timezone, busyRanges) {
    const [wsH, wsM] = workingStart.split(":").map((s) => Number(s));
    const [weH, weM] = workingEnd.split(":").map((s) => Number(s));
    const startDT = luxon_1.DateTime.fromISO(dateISO, { zone: timezone }).set({
        hour: wsH,
        minute: wsM,
        second: 0,
        millisecond: 0,
    });
    const endDT = luxon_1.DateTime.fromISO(dateISO, { zone: timezone }).set({
        hour: weH,
        minute: weM,
        second: 0,
        millisecond: 0,
    });
    const busyIntervals = busyRanges
        .map((b) => {
        const s = luxon_1.DateTime.fromISO(b.start).setZone(timezone);
        const e = luxon_1.DateTime.fromISO(b.end).setZone(timezone);
        if (!s.isValid || !e.isValid)
            return null;
        return luxon_1.Interval.fromDateTimes(s, e);
    })
        .filter(Boolean);
    const slots = [];
    let cursor = startDT;
    while (cursor.plus({ minutes: durationMinutes }) <= endDT) {
        const slotStart = cursor;
        const slotEnd = cursor.plus({ minutes: durationMinutes });
        const overlap = busyIntervals.some((bi) => bi.overlaps(luxon_1.Interval.fromDateTimes(slotStart, slotEnd)));
        if (!overlap) {
            slots.push({
                // toISO() can return string|null — use ?? "" to guarantee string type
                startISO: slotStart.toISO() ?? "",
                endISO: slotEnd.toISO() ?? "",
                label: `${slotStart.toFormat("HH:mm")}-${slotEnd.toFormat("HH:mm")}`,
            });
        }
        cursor = cursor.plus({ minutes: durationMinutes });
    }
    return slots;
}
