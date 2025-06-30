import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  AutoTradingOrderAction,
  AutoTradingOrderType,
  RiskLevel,
} from '../../../entities/auto-trading-order.entity';

export class CreateAutoTradingOrderDto {
  @IsNumber()
  portfolioId: number;

  @IsString()
  symbol: string;

  @IsEnum(AutoTradingOrderAction)
  action: AutoTradingOrderAction;

  @IsEnum(AutoTradingOrderType)
  orderType: AutoTradingOrderType;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  limitPrice?: number;

  @IsOptional()
  @IsNumber()
  stopPrice?: number;

  @IsOptional()
  @IsNumber()
  stopLossPrice?: number;

  @IsOptional()
  @IsNumber()
  takeProfitPrice?: number;

  @IsOptional()
  @IsNumber()
  trailAmount?: number;

  @IsOptional()
  @IsNumber()
  trailPercent?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryTime?: Date;

  @IsOptional()
  @IsUUID()
  recommendationId?: string;

  @IsNumber()
  confidence: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reasoning?: string[];

  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;

  @IsOptional()
  @IsNumber()
  riskPercentage?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAutoTradingOrderDto {
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  limitPrice?: number;

  @IsOptional()
  @IsNumber()
  stopPrice?: number;

  @IsOptional()
  @IsNumber()
  stopLossPrice?: number;

  @IsOptional()
  @IsNumber()
  takeProfitPrice?: number;

  @IsOptional()
  @IsNumber()
  trailAmount?: number;

  @IsOptional()
  @IsNumber()
  trailPercent?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiryTime?: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkOrderActionDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderIds: string[];

  @IsOptional()
  @IsString()
  reason?: string;
}
