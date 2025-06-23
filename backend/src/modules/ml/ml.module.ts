import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  MLABTest,
  MLFeatureImportance,
  MLMetric,
  MLModel,
  MLModelPerformance,
  MLPrediction,
} from './entities/ml.entities';
import { MLController } from './ml.controller';
import { MLService } from './services/ml.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MLModel,
      MLPrediction,
      MLMetric,
      MLABTest,
      MLFeatureImportance,
      MLModelPerformance,
    ]),
  ],
  controllers: [MLController],
  providers: [MLService],
  exports: [MLService],
})
export class MLModule {}
