import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Keep in sync with storefront `AI_CHAT_LIMITS` */
export const AI_CHAT_MESSAGE_MAX = 4000;
export const AI_CHAT_HISTORY_MAX_MESSAGES = 40;
export const AI_CHAT_HISTORY_ENTRY_MAX = 8000;

export class AiChatHistoryEntryDto {
  @ApiProperty({ enum: ['user', 'assistant', 'model', 'system'] })
  @IsString()
  @IsIn(['user', 'assistant', 'model', 'system'])
  role!: string;

  @ApiProperty({ maxLength: AI_CHAT_HISTORY_ENTRY_MAX })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(AI_CHAT_HISTORY_ENTRY_MAX)
  content!: string;
}

export class AiChatDto {
  @ApiProperty({ maxLength: AI_CHAT_MESSAGE_MAX })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(AI_CHAT_MESSAGE_MAX)
  message!: string;

  @ApiPropertyOptional({ type: [AiChatHistoryEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiChatHistoryEntryDto)
  @ArrayMaxSize(AI_CHAT_HISTORY_MAX_MESSAGES)
  history?: AiChatHistoryEntryDto[];
}
