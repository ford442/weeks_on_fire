import { schedule as scheduleRecord } from './generated/schedule';

export type { Schedule, ScheduleBlock, ScheduleSlot, ScheduleSponsor } from './types';

/** The EyeWash Station rundown from `content/schedule.json`: ids and times, no cutaway data. */
export const schedule = scheduleRecord;
