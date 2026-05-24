export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    name?: string;
}

export type LoginMode = "authorization" | "registration";