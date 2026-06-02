/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SearchScheduleStudentDto } from './SearchScheduleStudentDto';
import type { SearchScheduleUserDto } from './SearchScheduleUserDto';
export type SearchScheduleRegistrationDto = {
    studentId: string;
    userId: string;
    createdAt: string;
    pending?: boolean;
    student: SearchScheduleStudentDto;
    user: SearchScheduleUserDto;
};

