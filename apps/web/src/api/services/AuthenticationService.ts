/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ForgotPasswordDto } from '../models/ForgotPasswordDto';
import type { ImpersonateDto } from '../models/ImpersonateDto';
import type { RefreshTokenDto } from '../models/RefreshTokenDto';
import type { ResetPasswordDto } from '../models/ResetPasswordDto';
import type { SignInDto } from '../models/SignInDto';
import type { SignUpDto } from '../models/SignUpDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Register a new user
     * @param requestBody
     * @returns any User registered successfully
     * @throws ApiError
     */
    public static authenticationControllerSignUp(
        requestBody: SignUpDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/register',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Login a user
     * @param requestBody
     * @returns any User logged in successfully
     * @throws ApiError
     */
    public static authenticationControllerSignIn(
        requestBody: SignInDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/login',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Refresh authentication tokens
     * @param requestBody
     * @returns any Tokens refreshed successfully
     * @throws ApiError
     */
    public static authenticationControllerRefreshTokens(
        requestBody: RefreshTokenDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/refresh-tokens',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Logout the current user
     * @returns any User logged out successfully
     * @throws ApiError
     */
    public static authenticationControllerLogout(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/logout',
        });
    }
    /**
     * Impersonate a user (Admins only)
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static authenticationControllerImpersonate(
        requestBody: ImpersonateDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/impersonate',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Exit user impersonation
     * @returns any
     * @throws ApiError
     */
    public static authenticationControllerExitImpersonation(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/exit-impersonation',
        });
    }
    /**
     * Request a password reset email
     * @param requestBody
     * @returns any Password reset email sent
     * @throws ApiError
     */
    public static authenticationControllerForgotPassword(
        requestBody: ForgotPasswordDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/forgot-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reset user password
     * @param requestBody
     * @returns any Password reset successfully
     * @throws ApiError
     */
    public static authenticationControllerResetPassword(
        requestBody: ResetPasswordDto,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/reset-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Confirm an email address from a verification link
     * @param requestBody
     * @returns any Email address confirmed
     * @throws ApiError
     */
    public static authenticationControllerVerifyEmail(
        requestBody: { token: string },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/verify-email',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Resend the verification link for the signed-in account
     * @returns any Verification email sent
     * @throws ApiError
     */
    public static authenticationControllerResendVerification(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/resend-verification',
        });
    }
}
