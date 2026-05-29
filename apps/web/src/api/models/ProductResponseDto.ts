/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProductResponseDto = {
    /**
     * Product ID
     */
    id: string;
    /**
     * Order of the product
     */
    order: number;
    /**
     * Name of the product
     */
    name: string;
    /**
     * Type of lesson
     */
    lessonType: ProductResponseDto.lessonType;
    /**
     * Number of credits
     */
    credits: number;
    /**
     * Is the product active?
     */
    active: boolean;
    /**
     * Amount for the product
     */
    amount: number;
    /**
     * Product description
     */
    description: string;
    /**
     * Group schedule (session) this product sells, if linked
     */
    scheduleId?: string;
    /**
     * List of product features
     */
    features: Array<string>;
};
export namespace ProductResponseDto {
    /**
     * Type of lesson
     */
    export enum lessonType {
        PRIVATE = 'private',
        GROUP = 'group',
    }
}

