import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  RuleAction,
  RuleCondition,
  RuleType,
} from '../entities/trading-rule.entity';

export class CreateTradingRuleDto {
  @IsUUID()
  @IsNotEmpty()
  portfolio_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(RuleType)
  rule_type: RuleType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  conditions: RuleCondition[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  actions: RuleAction[];

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateTradingRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(RuleType)
  rule_type?: RuleType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  conditions?: RuleCondition[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  actions?: RuleAction[];

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
