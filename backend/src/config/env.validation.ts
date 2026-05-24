import { plainToInstance } from 'class-transformer';
import { IsString, IsNotEmpty, validateSync, MinLength, IsIn, IsOptional } from 'class-validator';

class EnvironmentVariables {
    @IsString()
    @IsNotEmpty()
    DATABASE_URL: string;

    @IsString()
    @MinLength(32)
    JWT_SECRET: string;

    @IsString()
    @IsNotEmpty()
    JWT_EXPIRES_IN: string;

    @IsString()
    @MinLength(32)
    JWT_REFRESH_SECRET: string;

    @IsString()
    @IsNotEmpty()
    JWT_REFRESH_EXPIRES_IN: string;

    @IsOptional()
    @IsIn(['development', 'production', 'test'])
    NODE_ENV?: 'development' | 'production' | 'test';

    @IsOptional()
    @IsString()
    COOKIE_DOMAIN?: string;
}

export function validateEnv(config: Record<string, unknown>) {
    const validated = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(validated, { skipMissingProperties: false });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }

    return validated;
}
