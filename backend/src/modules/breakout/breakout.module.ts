import { Module, forwardRef } from '@nestjs/common';
import { MLAnalysisModule } from '../ml-analysis/ml-analysis.module';
import { MLModule } from '../ml/ml.module';
import { BreakoutService } from './breakout.service';

@Module({
  imports: [MLAnalysisModule, forwardRef(() => MLModule)],
  providers: [BreakoutService],
  exports: [BreakoutService],
})
export class BreakoutModule {}
