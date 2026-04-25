import { Expose, Transform } from 'class-transformer';

export class GuestCustomerResponseDto {
    @Expose()
    email: string;

    @Expose()
    orderCount: number;

    @Expose()
    ltv: number;

    @Expose()
    lastOrderAt: Date;

    @Expose()
    @Transform(({ obj }) => {
        if (obj.ltv > 100000000) return 'VIP_GUEST';
        if (obj.orderCount > 3) return 'LOYAL_GUEST';
        return 'GUEST';
    })
    segment: string;
}
