import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TradingSessionConfig } from '../entities/trading-session.entity';

export class TradingSessionDto {
  @IsString()
  @IsNotEmpty()
  portfolio_id: string;

  @IsOptional()
  @IsString()
  session_name?: string;

  @IsOptional()
  config?: TradingSessionConfig;
}

export class StopTradingSessionDto {
  @IsOptional()
  @IsString()
  stop_reason?: string;
}
