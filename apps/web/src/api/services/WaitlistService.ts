/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WaitlistResponseDto } from '../models/WaitlistResponseDto';
import type { BulkArchiveWaitlistDto } from '../models/BulkArchiveWaitlistDto';
import type { BulkArchiveWaitlistResponseDto } from '../models/BulkArchiveWaitlistResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WaitlistService {
    /**
     * Get all waitlist entries
     * @param includeArchived
     * @returns WaitlistResponseDto
     * @throws ApiError
     */
    public static waitlistControllerFindAll(
        includeArchived?: boolean,
    ): CancelablePromise<Array<WaitlistResponseDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/waitlist',
            query: {
                'includeArchived': includeArchived,
            },
        });
    }
    /**
     * Get waitlist entry for current user
     * @returns WaitlistResponseDto
     * @throws ApiError
     */
    public static waitlistControllerMe(): CancelablePromise<WaitlistResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/waitlist/me',
        });
    }
    /**
     * Join the waitlist as the current user
     * @returns WaitlistResponseDto
     * @throws ApiError
     */
    public static waitlistControllerJoin(): CancelablePromise<WaitlistResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/waitlist/join',
        });
    }
    /**
     * Allow a user to purchase from the waitlist
     * @param userId
     * @returns WaitlistResponseDto
     * @throws ApiError
     */
    public static waitlistControllerUpdate(
        userId: string,
    ): CancelablePromise<WaitlistResponseDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/waitlist/{userId}/allow-purchase',
            path: {
                'userId': userId,
            },
        });
    }
    /**
     * Archive a waitlist entry
     * @param id Waitlist entry id
     * @returns WaitlistResponseDto
     * @throws ApiError
     */
    public static waitlistControllerArchive(
        id: string,
    ): CancelablePromise<WaitlistResponseDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/waitlist/{id}/archive',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Restore an archived waitlist entry
     * @param id Waitlist entry id
     * @returns WaitlistResponseDto
     * @throws ApiError
     */
    public static waitlistControllerUnarchive(
        id: string,
    ): CancelablePromise<WaitlistResponseDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/waitlist/{id}/unarchive',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Archive all waitlist entries created before a given date
     * @param requestBody
     * @returns BulkArchiveWaitlistResponseDto
     * @throws ApiError
     */
    public static waitlistControllerBulkArchive(
        requestBody: BulkArchiveWaitlistDto,
    ): CancelablePromise<BulkArchiveWaitlistResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/waitlist/bulk-archive',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
