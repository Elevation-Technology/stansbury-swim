/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateScheduleDto } from '../models/CreateScheduleDto';
import type { ParentTotScheduleResponseDto } from '../models/ParentTotScheduleResponseDto';
import type { ScheduleResponseDto } from '../models/ScheduleResponseDto';
import type { SearchScheduleResponseDto } from '../models/SearchScheduleResponseDto';
import type { UpdateScheduleDto } from '../models/UpdateScheduleDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ScheduleService {
    /**
     * Get all schedules
     * Returns all schedules, optionally filtered by scheduleIds.
     * @param scheduleIds Comma-separated list of schedule IDs to filter by
     * @returns ScheduleResponseDto
     * @throws ApiError
     */
    public static scheduleControllerFindAll(
        scheduleIds?: string,
    ): CancelablePromise<Array<ScheduleResponseDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/schedules',
            query: {
                'scheduleIds': scheduleIds,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static scheduleControllerCreate(
        requestBody: CreateScheduleDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/schedules',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all parent-tot schedules
     * @returns ParentTotScheduleResponseDto List of parent-tot schedules
     * @throws ApiError
     */
    public static scheduleControllerFindAllParentTot(): CancelablePromise<Array<ParentTotScheduleResponseDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/schedules/parent-tot',
        });
    }
    /**
     * Get all schedules for the logged-in user
     * Returns all upcoming schedules for the current user.
     * @returns ScheduleResponseDto
     * @throws ApiError
     */
    public static scheduleControllerFindAllForLoggedInUser(): CancelablePromise<Array<ScheduleResponseDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/schedules/me',
        });
    }
    /**
     * Search schedules
     * Search for schedules by pools, instructors, days of week, date, timezone, and includeReserved.
     * @param pools List of pool IDs
     * @param instructors List of instructor IDs
     * @param daysOfWeek List of days of the week
     * @param date Date to search for (YYYY-MM-DD)
     * @param timezone Timezone
     * @param includeReserved Include reserved schedules
     * @returns SearchScheduleResponseDto
     * @throws ApiError
     */
    public static scheduleControllerSearch(
        pools?: Array<string>,
        instructors?: Array<string>,
        daysOfWeek?: Array<string>,
        date?: string,
        timezone?: string,
        includeReserved?: boolean,
    ): CancelablePromise<Array<SearchScheduleResponseDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/schedules/search',
            query: {
                'pools': pools,
                'instructors': instructors,
                'daysOfWeek': daysOfWeek,
                'date': date,
                'timezone': timezone,
                'includeReserved': includeReserved,
            },
        });
    }
    /**
     * @param timezone IANA timezone (e.g., America/Denver)
     * @returns any
     * @throws ApiError
     */
    public static scheduleControllerFindAvailableDates(
        timezone?: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/schedules/available-dates',
            query: {
                'timezone': timezone,
            },
        });
    }
    /**
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static scheduleControllerFindOne(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/schedules/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static scheduleControllerUpdate(
        id: string,
        requestBody: UpdateScheduleDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/schedules/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static scheduleControllerRemove(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/schedules/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static scheduleControllerSendPendingReminders(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/schedules/send-pending-reminders',
        });
    }
}
