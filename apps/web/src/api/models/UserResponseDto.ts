/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserResponseDto = {
    id: string;
    email: string;
    emailVerified?: boolean;
    pendingEmail?: string;
    firstName: string;
    lastName: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    privateRegistration: boolean;
    role: UserResponseDto.role;
    failedLoginAttempts: number;
    lastFailedLogin?: string;
    signedWaiver?: boolean;
    waiverSignature?: string;
    waiverSignatureDate?: string;
    instructorId?: string;
    createdAt?: string;
    updatedAt?: string;
};
export namespace UserResponseDto {
    export enum role {
        USER = 'user',
        ADMIN = 'admin',
        INSTRUCTOR = 'instructor',
    }
}

