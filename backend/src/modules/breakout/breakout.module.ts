import { Module } from '@nestjs/common';
import { MLAnalysisModule } from '../ml-analysis/ml-analysis.module';
import { BreakoutService } from './breakout.service';

@Module({
  imports: [MLAnalysisModule],
  providers: [BreakoutService],
  exports: [BreakoutService],
})
export class BreakoutModule {}
