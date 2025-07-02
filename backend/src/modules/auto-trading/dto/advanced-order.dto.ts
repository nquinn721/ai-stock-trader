import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { AdvancedOrderStrategy } from '../services/advanced-order-execution.service';

export enum OrderSideDto {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderTypeDto {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP_LIMIT = 'STOP_LIMIT',
}

export enum ExecutionStyleDto {
  AGGRESSIVE = 'AGGRESSIVE',
  PASSIVE = 'PASSIVE',
  SMART = 'SMART',
}

export enum TimeInForceDto {
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M',
  GTC = 'GTC',
}

export class ConditionalTriggerDto {
  @IsEnum(['PRICE', 'VOLUME', 'TECHNICAL_INDICATOR', 'TIME'])
  type: 'PRICE' | 'VOLUME' | 'TECHNICAL_INDICATOR' | 'TIME';

  @IsEnum([
    'GREATER_THAN',
    'LESS_THAN',
    'EQUAL_TO',
    'CROSSES_ABOVE',
    'CROSSES_BELOW',
  ])
  condition:
    | 'GREATER_THAN'
    | 'LESS_THAN'
    | 'EQUAL_TO'
    | 'CROSSES_ABOVE'
    | 'CROSSES_BELOW';

  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  parameter?: string;
}

export class CreateAdvancedOrderDto {
  @IsNumber()
  portfolioId: number;

  @IsString()
  symbol: string;

  @IsEnum(AdvancedOrderStrategy)
  strategy: AdvancedOrderStrategy;

  @IsString()
  recommendationId: string;

  // Order parameters
  @IsEnum(OrderSideDto)
  side: OrderSideDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  baseQuantity?: number;

  @IsEnum(OrderTypeDto)
  orderType: OrderTypeDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  limitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stopPrice?: number;

  // Risk management
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  stopLossPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  takeProfitPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  trailingStopPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  riskRewardRatio?: number;

  // Conditional triggers
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionalTriggerDto)
  conditionalTriggers?: ConditionalTriggerDto[];

  // Execution preferences
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  maxSlippage?: number;

  @IsOptional()
  @IsEnum(TimeInForceDto)
  timeInForce?: TimeInForceDto;

  @IsOptional()
  @IsEnum(ExecutionStyleDto)
  executionStyle?: ExecutionStyleDto;
}

export class ModifyAdvancedOrderDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  limitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stopPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  stopLossPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  takeProfitPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  trailingStopPercent?: number;
}

export class AdvancedOrderResponseDto {
  id: string;
  portfolioId: number;
  symbol: string;
  strategy: string;
  status: string;
  createdAt: Date;
  expiryTime: Date;
  primaryOrder: {
    side: string;
    quantity: number;
    orderType: string;
    limitPrice?: number;
    stopPrice?: number;
  };
  riskManagement: {
    maxPositionSize: number;
    portfolioRiskPercent: number;
    riskRewardRatio: number;
  };
}
