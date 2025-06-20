import { Module } from '@nestjs/common';
import { MLAnalysisService } from './ml-analysis.service';

@Module({
  providers: [MLAnalysisService],
  exports: [MLAnalysisService],
})
export class MLAnalysisModule {}
