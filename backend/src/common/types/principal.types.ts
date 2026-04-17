export enum PrincipalType {
    USER = 'USER',
    GUEST = 'GUEST',
    SYSTEM = 'SYSTEM',
}

export interface Principal {
    id: string; // userId if authenticated, sessionId if guest
    type: PrincipalType;
    roles?: string[];
    ip?: string;
}
