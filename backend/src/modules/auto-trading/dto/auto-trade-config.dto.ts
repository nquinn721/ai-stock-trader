import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AutoTradeStatus, TradeType } from '../entities/auto-trade.entity';

export class AutoTradeConfigDto {
  @IsUUID()
  @IsNotEmpty()
  portfolio_id: string;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsEnum(TradeType)
  trade_type: TradeType;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  trigger_price?: number;

  @IsOptional()
  @IsUUID()
  rule_id?: string;

  @IsOptional()
  @IsUUID()
  recommendation_id?: string;
}

export class TradeFiltersDto {
  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsEnum(AutoTradeStatus)
  status?: AutoTradeStatus;

  @IsOptional()
  @IsEnum(TradeType)
  trade_type?: TradeType;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
