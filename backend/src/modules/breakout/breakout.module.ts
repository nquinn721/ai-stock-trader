import { Module } from '@nestjs/common';
import { MLAnalysisModule } from '../ml-analysis/ml-analysis.module';
import { MLModule } from '../ml/ml.module';
import { BreakoutService } from './breakout.service';

@Module({
  imports: [MLAnalysisModule, MLModule],
  providers: [BreakoutService],
  exports: [BreakoutService],
})
export class BreakoutModule {}
