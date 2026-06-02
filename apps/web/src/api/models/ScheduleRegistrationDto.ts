/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScheduleStudentDto } from './ScheduleStudentDto';
import type { ScheduleUserDto } from './ScheduleUserDto';
export type ScheduleRegistrationDto = {
    studentId: string;
    userId: string;
    createdAt: string;
    pending?: boolean;
    student: ScheduleStudentDto;
    user: ScheduleUserDto;
};

