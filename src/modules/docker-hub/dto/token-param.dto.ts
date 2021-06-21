import { IsString, IsMongoId } from 'class-validator';

/**
 * A DTO with the token parameter used to verify DockerHub webhook calls
 */
export class TokenParamDto {
  @IsString()
  @IsMongoId({ message: 'Invalid token' })
  readonly token: string;
}
