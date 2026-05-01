/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StatsResponseDto } from '../models/StatsResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StatsService {
    /**
     * @param instructorId
     * @returns StatsResponseDto The stats for the instructor
     * @throws ApiError
     */
    public static statsControllerFindInstructorStats(
        instructorId: string,
    ): CancelablePromise<StatsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stats/instructor/{instructorId}',
            path: {
                'instructorId': instructorId,
            },
        });
    }
    /**
     * @param year Season year (defaults to current year)
     * @returns StatsResponseDto The stats for the site
     * @throws ApiError
     */
    public static statsControllerFindAll(
        year?: number,
    ): CancelablePromise<StatsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stats',
            query: {
                'year': year,
            },
        });
    }
}
