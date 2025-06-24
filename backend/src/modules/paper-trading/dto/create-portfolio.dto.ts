import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum PortfolioType {
  DAY_TRADING_PRO = 'DAY_TRADING_PRO',
  DAY_TRADING_STANDARD = 'DAY_TRADING_STANDARD',
  SMALL_ACCOUNT_BASIC = 'SMALL_ACCOUNT_BASIC',
  MICRO_ACCOUNT_STARTER = 'MICRO_ACCOUNT_STARTER',
}

export class CreatePortfolioDto {
  @ApiProperty({
    description: 'User ID for the portfolio owner',
    example: 'user123',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Type of portfolio to create',
    enum: PortfolioType,
    example: PortfolioType.SMALL_ACCOUNT_BASIC,
  })
  @IsNotEmpty()
  @IsEnum(PortfolioType)
  portfolioType: PortfolioType;

  @ApiProperty({
    description: 'Initial balance for the portfolio (optional)',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  initialBalance?: number;
}
