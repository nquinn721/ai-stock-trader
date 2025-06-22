import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { OrderType } from '../../../entities/order.entity';

export class CreateOrderDto {
  @IsNumber()
  portfolioId: number;

  @IsString()
  symbol: string;

  @IsEnum(OrderType)
  type: OrderType;

  @IsNumber()
  @Min(0.01)
  triggerPrice: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  positionId?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  expirationDate?: Date;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  triggerPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  expirationDate?: Date;
}

export class OrderResponseDto {
  id: number;
  portfolioId: number;
  symbol: string;
  type: OrderType;
  status: string;
  triggerPrice: number;
  quantity: number;
  executedPrice?: number;
  executedAt?: Date;
  positionId?: number;
  notes?: string;
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
