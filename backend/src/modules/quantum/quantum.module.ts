import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuantumController } from './quantum.controller';
import { QuantumOptimizationService } from './services/quantum-optimization.service';
import { QuantumSimulationService } from './services/quantum-simulation.service';
import { HybridQuantumClassicalService } from './services/hybrid-quantum-classical.service';

@Module({
  imports: [ConfigModule],
  controllers: [QuantumController],
  providers: [
    QuantumOptimizationService,
    QuantumSimulationService,
    HybridQuantumClassicalService,
  ],
  exports: [
    QuantumOptimizationService,
    QuantumSimulationService,
    HybridQuantumClassicalService,
  ],
})
export class QuantumModule {}
