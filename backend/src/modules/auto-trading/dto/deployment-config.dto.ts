import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class RiskLimitsDto {
  @IsNumber()
  maxDrawdown: number;

  @IsNumber()
  maxPositionSize: number;

  @IsNumber()
  dailyLossLimit: number;

  @IsNumber()
  correlationLimit: number;
}

class NotificationConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsBoolean()
  onTrade: boolean;

  @IsBoolean()
  onError: boolean;

  @IsBoolean()
  onRiskBreach: boolean;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  webhook?: string;
}

export class DeploymentConfigDto {
  @IsEnum(['paper', 'live'])
  mode: 'paper' | 'live';

  @IsString()
  @IsNotEmpty()
  portfolioId: string;

  @IsNumber()
  initialCapital: number;

  @IsNumber()
  maxPositions: number;

  @ValidateNested()
  @Type(() => RiskLimitsDto)
  riskLimits: RiskLimitsDto;

  @IsEnum(['minute', 'hour', 'daily'])
  executionFrequency: 'minute' | 'hour' | 'daily';

  @IsOptional()
  @IsString({ each: true })
  symbols?: string[];

  @ValidateNested()
  @Type(() => NotificationConfigDto)
  notifications: NotificationConfigDto;
}
