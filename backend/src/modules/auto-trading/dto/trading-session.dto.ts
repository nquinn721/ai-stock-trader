import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TradingSessionConfig } from '../entities/trading-session.entity';

export class TradingSessionDto {
  @IsUUID()
  @IsNotEmpty()
  portfolio_id: string;

  @IsOptional()
  @IsString()
  session_name?: string;

  @ValidateNested()
  @Type(() => Object)
  config: TradingSessionConfig;
}

export class StopTradingSessionDto {
  @IsOptional()
  @IsString()
  stop_reason?: string;
}
