import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FilterType, FilterOperator, ScanCriteria, FilterCriteria } from '../entities/scanner.entity';

export class FilterCriteriaDto {
  @IsString()
  id: string;

  @IsEnum(FilterType)
  type: FilterType;

  @IsString()
  field: string;

  @IsEnum(FilterOperator)
  operator: FilterOperator;

  // Value can be string or number, but we'll receive it as string and convert as needed
  @Transform(({ value }) => {
    if (typeof value === 'string' && !isNaN(Number(value))) {
      return Number(value);
    }
    return value;
  })
  value: string | number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value !== undefined && typeof value === 'string' && !isNaN(Number(value))) {
      return Number(value);
    }
    return value;
  })
  value2?: number;

  @IsOptional()
  @IsEnum(['AND', 'OR'])
  logicalOperator?: 'AND' | 'OR';

  // Helper method to convert DTO to entity format
  toEntity(): FilterCriteria {
    return {
      id: this.id,
      type: this.type,
      field: this.field,
      operator: this.operator,
      value: this.value,
      value2: this.value2,
      logicalOperator: this.logicalOperator,
    };
  }
}

export class ScanCriteriaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterCriteriaDto)
  filters: FilterCriteriaDto[];

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsBoolean()
  includePreMarket?: boolean;

  @IsOptional()
  @IsBoolean()
  includeAfterHours?: boolean;

  // Helper method to convert DTO to entity format
  toEntity(): ScanCriteria {
    return {
      filters: this.filters.map(filter => filter.toEntity()),
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      limit: this.limit,
      includePreMarket: this.includePreMarket,
      includeAfterHours: this.includeAfterHours,
    };
  }
}

export class CreateScreenerTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateNested()
  @Type(() => ScanCriteriaDto)
  criteria: ScanCriteriaDto;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateScreenerTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScanCriteriaDto)
  criteria?: ScanCriteriaDto;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateMarketAlertDto {
  @IsNumber()
  userId: number;

  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => ScanCriteriaDto)
  criteria: ScanCriteriaDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationTypes?: string[];

  @IsOptional()
  @IsNumber()
  scanInterval?: number;

  @IsOptional()
  @IsNumber()
  minMatchStrength?: number;
}

export class UpdateMarketAlertDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScanCriteriaDto)
  criteria?: ScanCriteriaDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationTypes?: string[];

  @IsOptional()
  @IsNumber()
  scanInterval?: number;

  @IsOptional()
  @IsNumber()
  minMatchStrength?: number;
}

export class ScanRequestDto extends ScanCriteriaDto {
  @IsOptional()
  @IsBoolean()
  saveAsTemplate?: boolean;

  @IsOptional()
  @IsString()
  templateName?: string;
}

export class BacktestRequestDto {
  @ValidateNested()
  @Type(() => ScanCriteriaDto)
  criteria: ScanCriteriaDto;

  @IsString()
  startDate: string; // ISO date string

  @IsString()
  endDate: string; // ISO date string

  @IsOptional()
  @IsString()
  interval?: string; // '1d', '1h', etc.
}

export class AlertTriggerDto {
  @IsNumber()
  alertId: number;

  @IsArray()
  @IsString({ each: true })
  matchingSymbols: string[];

  @IsString()
  timestamp: string;
}
