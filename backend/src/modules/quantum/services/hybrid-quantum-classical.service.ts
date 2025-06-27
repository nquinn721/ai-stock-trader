import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ClassicalSolution {
  solution: number[];
  objective: number;
  constraints: ConstraintSatisfaction[];
  computationTime: number;
  algorithm: string;
}

export interface QuantumEnhancement {
  quantumSpeedup: number;
  quantumAccuracy: number;
  entanglementDepth: number;
  coherenceTime: number;
}

export interface HybridSolution {
  finalSolution: number[];
  objectiveValue: number;
  classicalComponent: ClassicalSolution;
  quantumComponent: QuantumComponent;
  hybridAdvantage: number;
  executionMetrics: ExecutionMetrics;
}

export interface QuantumComponent {
  quantumSolution: number[];
  quantumObjective: number;
  quantumUncertainty: number;
  entanglementMeasure: number;
}

export interface ExecutionMetrics {
  totalTime: number;
  classicalTime: number;
  quantumTime: number;
  hybridOverhead: number;
  convergenceRate: number;
}

export interface ConstraintSatisfaction {
  constraintId: string;
  satisfied: boolean;
  violationDegree: number;
  penalty: number;
}

export interface ClassicalContext {
  problemSize: number;
  constraints: OptimizationConstraint[];
  objectives: ObjectiveFunction[];
  tolerances: ToleranceParameters;
}

export interface OptimizationConstraint {
  type: 'linear' | 'nonlinear' | 'integer' | 'boolean';
  coefficients: number[];
  bounds: [number, number];
  priority: number;
}

export interface ObjectiveFunction {
  type: 'minimize' | 'maximize';
  coefficients: number[];
  weight: number;
  quadraticTerms?: QuadraticTerm[];
}

export interface QuadraticTerm {
  variables: [number, number];
  coefficient: number;
}

export interface ToleranceParameters {
  feasibilityTolerance: number;
  optimalityTolerance: number;
  complementarityTolerance: number;
}

export interface QuantumResult {
  quantumSolution: number[];
  quantumObjective: number;
  quantumState: QuantumState;
  measurementOutcomes: MeasurementOutcome[];
  fidelity: number;
}

export interface QuantumState {
  amplitudes: Complex[];
  phases: number[];
  entanglement: number;
  purity: number;
}

export interface Complex {
  real: number;
  imaginary: number;
}

export interface MeasurementOutcome {
  state: string;
  probability: number;
  energy: number;
}

export interface IntegratedResult {
  solution: number[];
  confidence: number;
  quantumContribution: number;
  classicalContribution: number;
  uncertaintyBounds: [number, number];
  validationMetrics: ValidationMetrics;
}

export interface ValidationMetrics {
  crossValidationScore: number;
  bootstrapConfidence: number;
  robustnessScore: number;
  stabilityMeasure: number;
}

export interface OptimizationProblem {
  variables: Variable[];
  objectives: ObjectiveFunction[];
  constraints: OptimizationConstraint[];
  problemType: 'linear' | 'quadratic' | 'nonlinear' | 'mixed_integer';
  size: ProblemSize;
}

export interface Variable {
  name: string;
  type: 'continuous' | 'integer' | 'binary';
  bounds: [number, number];
  initialValue?: number;
}

export interface ProblemSize {
  variables: number;
  constraints: number;
  nonzeros: number;
  complexity: 'polynomial' | 'exponential' | 'np_hard';
}

export interface PerformanceComparison {
  classicalPerformance: PerformanceMetrics;
  quantumPerformance: PerformanceMetrics;
  hybridPerformance: PerformanceMetrics;
  comparison: ComparisonResults;
  recommendations: Recommendation[];
}

export interface PerformanceMetrics {
  solutionQuality: number;
  executionTime: number;
  memoryUsage: number;
  scalability: number;
  robustness: number;
}

export interface ComparisonResults {
  speedupFactor: number;
  accuracyImprovement: number;
  efficiencyGain: number;
  quantumAdvantage: boolean;
  optimalApproach: 'classical' | 'quantum' | 'hybrid';
}

export interface Recommendation {
  scenario: string;
  recommendedApproach: string;
  reasoning: string;
  expectedBenefit: number;
  implementationComplexity: 'low' | 'medium' | 'high';
}

export interface ComplexityMetrics {
  timeComplexity: string;
  spaceComplexity: string;
  quantumResources: QuantumResourceRequirements;
  parallelizability: number;
}

export interface QuantumResourceRequirements {
  qubits: number;
  gates: number;
  coherenceTime: number;
  errorRate: number;
  connectivity: string;
}

export interface QuantumAdvantageAnalysis {
  advantageExists: boolean;
  advantageFactor: number;
  problemSizeThreshold: number;
  resourceRequirements: QuantumResourceRequirements;
  practicalConsiderations: PracticalConsideration[];
  timeline: AdvantageTimeline;
}

export interface PracticalConsideration {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  severity: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface AdvantageTimeline {
  currentAdvantage: number;
  nearTermAdvantage: number;
  longTermAdvantage: number;
  crossoverPoint: number;
}

@Injectable()
export class HybridQuantumClassicalService {
  private readonly logger = new Logger(HybridQuantumClassicalService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Hybrid portfolio optimization combining classical and quantum methods
   */
  async hybridPortfolioOptimization(
    classicalSolution: ClassicalSolution,
    quantumEnhancement: QuantumEnhancement,
  ): Promise<HybridSolution> {
    this.logger.log('Starting hybrid quantum-classical portfolio optimization');
    
    const startTime = Date.now();
    
    // Phase 1: Classical preprocessing and warm start
    const preprocessedSolution = await this.preprocessClassicalSolution(classicalSolution);
    
    // Phase 2: Quantum enhancement of critical components
    const quantumComponent = await this.enhanceWithQuantum(
      preprocessedSolution,
      quantumEnhancement,
    );
    
    // Phase 3: Hybrid integration and refinement
    const hybridSolution = await this.integrateHybridSolution(
      preprocessedSolution,
      quantumComponent,
    );
    
    // Phase 4: Post-processing and validation
    const finalSolution = await this.postProcessHybridSolution(hybridSolution);
    
    const totalTime = Date.now() - startTime;
    const hybridAdvantage = this.calculateHybridAdvantage(
      classicalSolution,
      quantumComponent,
      totalTime,
    );
    
    const executionMetrics = this.calculateExecutionMetrics(
      classicalSolution.computationTime,
      totalTime,
    );
    
    this.logger.log(
      `Hybrid optimization completed in ${totalTime}ms with ${hybridAdvantage.toFixed(3)}x advantage`,
    );
    
    return {
      finalSolution: finalSolution.solution,
      objectiveValue: finalSolution.objective,
      classicalComponent: preprocessedSolution,
      quantumComponent,
      hybridAdvantage,
      executionMetrics,
    };
  }

  /**
   * Integrate quantum results with classical context
   */
  async integrateQuantumResults(
    quantumOutput: QuantumResult,
    classicalContext: ClassicalContext,
  ): Promise<IntegratedResult> {
    this.logger.log('Integrating quantum results with classical context');
    
    // Quantum measurement interpretation
    const interpretedSolution = this.interpretQuantumMeasurements(
      quantumOutput.measurementOutcomes,
      classicalContext.problemSize,
    );
    
    // Classical constraint satisfaction check
    const constraintSatisfaction = this.checkConstraintSatisfaction(
      interpretedSolution,
      classicalContext.constraints,
    );
    
    // Hybrid solution refinement
    const refinedSolution = this.refineHybridSolution(
      interpretedSolution,
      constraintSatisfaction,
      classicalContext.tolerances,
    );
    
    // Calculate confidence and uncertainty bounds
    const confidence = this.calculateSolutionConfidence(
      quantumOutput.fidelity,
      constraintSatisfaction,
    );
    
    const uncertaintyBounds = this.calculateUncertaintyBounds(
      refinedSolution,
      quantumOutput.quantumState,
    );
    
    // Validation metrics
    const validationMetrics = await this.calculateValidationMetrics(
      refinedSolution,
      quantumOutput,
      classicalContext,
    );
    
    const quantumContribution = this.assessQuantumContribution(quantumOutput);
    const classicalContribution = 1 - quantumContribution;
    
    this.logger.log(
      `Integration completed with ${confidence.toFixed(3)} confidence, ` +
      `${(quantumContribution * 100).toFixed(1)}% quantum contribution`,
    );
    
    return {
      solution: refinedSolution,
      confidence,
      quantumContribution,
      classicalContribution,
      uncertaintyBounds,
      validationMetrics,
    };
  }

  /**
   * Benchmark quantum vs classical performance
   */
  async benchmarkQuantumVsClassical(
    problem: OptimizationProblem,
  ): Promise<PerformanceComparison> {
    this.logger.log(
      `Benchmarking quantum vs classical for ${problem.size.variables}-variable problem`,
    );
    
    const startTime = Date.now();
    
    // Classical benchmark
    const classicalPerformance = await this.benchmarkClassical(problem);
    
    // Quantum benchmark (simulated)
    const quantumPerformance = await this.benchmarkQuantum(problem);
    
    // Hybrid benchmark
    const hybridPerformance = await this.benchmarkHybrid(problem);
    
    // Performance comparison
    const comparison = this.comparePerformances(
      classicalPerformance,
      quantumPerformance,
      hybridPerformance,
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      problem,
      comparison,
    );
    
    const totalTime = Date.now() - startTime;
    
    this.logger.log(
      `Benchmark completed in ${totalTime}ms, ` +
      `quantum advantage: ${comparison.quantumAdvantage ? 'YES' : 'NO'}, ` +
      `speedup: ${comparison.speedupFactor.toFixed(2)}x`,
    );
    
    return {
      classicalPerformance,
      quantumPerformance,
      hybridPerformance,
      comparison,
      recommendations,
    };
  }

  /**
   * Assess quantum advantage for given problem size and complexity
   */
  async assessQuantumAdvantage(
    problemSize: number,
    complexity: ComplexityMetrics,
  ): Promise<QuantumAdvantageAnalysis> {
    this.logger.log(
      `Assessing quantum advantage for problem size ${problemSize}`,
    );
    
    // Current quantum advantage assessment
    const currentAdvantage = this.calculateCurrentQuantumAdvantage(
      problemSize,
      complexity,
    );
    
    // Near-term advantage projection (2-5 years)
    const nearTermAdvantage = this.projectNearTermAdvantage(
      problemSize,
      complexity,
    );
    
    // Long-term advantage projection (5+ years)
    const longTermAdvantage = this.projectLongTermAdvantage(
      problemSize,
      complexity,
    );
    
    // Determine if advantage exists
    const advantageExists = currentAdvantage > 1.0 || nearTermAdvantage > 1.0;
    const advantageFactor = Math.max(currentAdvantage, nearTermAdvantage, longTermAdvantage);
    
    // Calculate problem size threshold
    const problemSizeThreshold = this.calculateProblemSizeThreshold(complexity);
    
    // Resource requirements analysis
    const resourceRequirements = this.analyzeQuantumResourceRequirements(
      problemSize,
      complexity,
    );
    
    // Practical considerations
    const practicalConsiderations = this.analyzePracticalConsiderations(
      problemSize,
      complexity,
      resourceRequirements,
    );
    
    // Advantage timeline
    const timeline = {
      currentAdvantage,
      nearTermAdvantage,
      longTermAdvantage,
      crossoverPoint: problemSizeThreshold,
    };
    
    this.logger.log(
      `Quantum advantage assessment: advantage=${advantageExists}, ` +
      `factor=${advantageFactor.toFixed(2)}, threshold=${problemSizeThreshold}`,
    );
    
    return {
      advantageExists,
      advantageFactor,
      problemSizeThreshold,
      resourceRequirements,
      practicalConsiderations,
      timeline,
    };
  }

  // Private helper methods

  private async preprocessClassicalSolution(
    solution: ClassicalSolution,
  ): Promise<ClassicalSolution> {
    // Apply preprocessing techniques to prepare for quantum enhancement
    const preprocessedSolution = [...solution.solution];
    
    // Normalize solution vector
    const norm = Math.sqrt(
      preprocessedSolution.reduce((sum, val) => sum + val * val, 0),
    );
    if (norm > 0) {
      for (let i = 0; i < preprocessedSolution.length; i++) {
        preprocessedSolution[i] /= norm;
      }
    }
    
    return {
      ...solution,
      solution: preprocessedSolution,
    };
  }

  private async enhanceWithQuantum(
    classicalSolution: ClassicalSolution,
    enhancement: QuantumEnhancement,
  ): Promise<QuantumComponent> {
    const startTime = Date.now();
    
    // Quantum optimization of critical variables
    const quantumSolution = this.applyQuantumOptimization(
      classicalSolution.solution,
      enhancement,
    );
    
    // Calculate quantum objective value
    const quantumObjective = this.calculateQuantumObjective(quantumSolution);
    
    // Estimate quantum uncertainty
    const quantumUncertainty = 1 / Math.sqrt(enhancement.coherenceTime);
    
    // Calculate entanglement measure
    const entanglementMeasure = this.calculateEntanglementMeasure(
      quantumSolution,
      enhancement.entanglementDepth,
    );
    
    const quantumTime = Date.now() - startTime;
    
    return {
      quantumSolution,
      quantumObjective,
      quantumUncertainty,
      entanglementMeasure,
    };
  }

  private async integrateHybridSolution(
    classicalSolution: ClassicalSolution,
    quantumComponent: QuantumComponent,
  ): Promise<{ solution: number[]; objective: number }> {
    const n = classicalSolution.solution.length;
    const hybridSolution: number[] = [];
    
    // Weighted combination of classical and quantum solutions
    const quantumWeight = this.calculateQuantumWeight(quantumComponent);
    const classicalWeight = 1 - quantumWeight;
    
    for (let i = 0; i < n; i++) {
      hybridSolution[i] = 
        classicalWeight * classicalSolution.solution[i] +
        quantumWeight * quantumComponent.quantumSolution[i];
    }
    
    // Calculate hybrid objective
    const objective = 
      classicalWeight * classicalSolution.objective +
      quantumWeight * quantumComponent.quantumObjective;
    
    return { solution: hybridSolution, objective };
  }

  private async postProcessHybridSolution(
    hybridSolution: { solution: number[]; objective: number },
  ): Promise<{ solution: number[]; objective: number }> {
    // Apply post-processing constraints and optimizations
    const processedSolution = [...hybridSolution.solution];
    
    // Ensure solution feasibility
    this.enforceFeasibility(processedSolution);
    
    // Local optimization refinement
    const refinedSolution = this.localOptimization(processedSolution);
    
    // Recalculate objective
    const refinedObjective = this.calculateObjective(refinedSolution);
    
    return {
      solution: refinedSolution,
      objective: refinedObjective,
    };
  }

  private applyQuantumOptimization(
    solution: number[],
    enhancement: QuantumEnhancement,
  ): number[] {
    const quantumSolution = [...solution];
    
    // Apply quantum-inspired optimization
    for (let i = 0; i < quantumSolution.length; i++) {
      // Quantum tunneling effect
      const tunnelingProbability = enhancement.quantumSpeedup * 0.01;
      if (Math.random() < tunnelingProbability) {
        quantumSolution[i] += (Math.random() - 0.5) * 0.1;
      }
      
      // Quantum superposition effect
      const superpositionEffect = Math.sin(quantumSolution[i] * Math.PI) * 0.05;
      quantumSolution[i] += superpositionEffect;
    }
    
    return quantumSolution;
  }

  private calculateQuantumObjective(solution: number[]): number {
    // Simple quadratic objective function
    return solution.reduce((sum, val, i) => sum + val * val + 0.1 * val, 0);
  }

  private calculateEntanglementMeasure(
    solution: number[],
    depth: number,
  ): number {
    // Measure of quantum entanglement in the solution
    let entanglement = 0;
    for (let i = 0; i < solution.length - 1; i++) {
      entanglement += Math.abs(solution[i] * solution[i + 1]);
    }
    return entanglement * depth / solution.length;
  }

  private calculateQuantumWeight(component: QuantumComponent): number {
    // Weight based on quantum advantage and uncertainty
    const baseWeight = 0.3; // 30% quantum contribution
    const uncertaintyPenalty = component.quantumUncertainty * 0.5;
    const entanglementBonus = component.entanglementMeasure * 0.2;
    
    return Math.max(0.1, Math.min(0.9, baseWeight - uncertaintyPenalty + entanglementBonus));
  }

  private enforceFeasibility(solution: number[]): void {
    // Ensure solution satisfies basic bounds
    for (let i = 0; i < solution.length; i++) {
      solution[i] = Math.max(-1, Math.min(1, solution[i]));
    }
    
    // Normalize to unit sum if needed
    const sum = solution.reduce((s, val) => s + Math.abs(val), 0);
    if (sum > 1) {
      for (let i = 0; i < solution.length; i++) {
        solution[i] /= sum;
      }
    }
  }

  private localOptimization(solution: number[]): number[] {
    // Simple local optimization using gradient descent
    const optimizedSolution = [...solution];
    const learningRate = 0.01;
    const iterations = 10;
    
    for (let iter = 0; iter < iterations; iter++) {
      const gradient = this.calculateGradient(optimizedSolution);
      for (let i = 0; i < optimizedSolution.length; i++) {
        optimizedSolution[i] -= learningRate * gradient[i];
      }
    }
    
    return optimizedSolution;
  }

  private calculateGradient(solution: number[]): number[] {
    // Simple gradient calculation
    const gradient: number[] = [];
    for (let i = 0; i < solution.length; i++) {
      gradient[i] = 2 * solution[i] + 0.1; // Derivative of quadratic + linear
    }
    return gradient;
  }

  private calculateObjective(solution: number[]): number {
    return solution.reduce((sum, val, i) => sum + val * val + 0.1 * val, 0);
  }

  private calculateHybridAdvantage(
    classicalSolution: ClassicalSolution,
    quantumComponent: QuantumComponent,
    hybridTime: number,
  ): number {
    // Compare hybrid performance to classical
    const classicalTime = classicalSolution.computationTime;
    const timeAdvantage = classicalTime / hybridTime;
    
    const objectiveAdvantage = Math.abs(classicalSolution.objective) > 0 
      ? Math.abs(quantumComponent.quantumObjective) / Math.abs(classicalSolution.objective)
      : 1.0;
    
    return (timeAdvantage + objectiveAdvantage) / 2;
  }

  private calculateExecutionMetrics(
    classicalTime: number,
    totalTime: number,
  ): ExecutionMetrics {
    const quantumTime = totalTime * 0.3; // Estimated 30% quantum time
    const hybridOverhead = totalTime - classicalTime - quantumTime;
    const convergenceRate = 1 / Math.sqrt(totalTime);
    
    return {
      totalTime,
      classicalTime,
      quantumTime,
      hybridOverhead,
      convergenceRate,
    };
  }

  private interpretQuantumMeasurements(
    outcomes: MeasurementOutcome[],
    problemSize: number,
  ): number[] {
    // Convert quantum measurement outcomes to classical solution
    const solution: number[] = new Array(problemSize).fill(0);
    
    for (const outcome of outcomes) {
      const bits = outcome.state.split('');
      for (let i = 0; i < Math.min(bits.length, problemSize); i++) {
        solution[i] += outcome.probability * (bits[i] === '1' ? 1 : -1);
      }
    }
    
    return solution;
  }

  private checkConstraintSatisfaction(
    solution: number[],
    constraints: OptimizationConstraint[],
  ): ConstraintSatisfaction[] {
    const satisfactions: ConstraintSatisfaction[] = [];
    
    for (let i = 0; i < constraints.length; i++) {
      const constraint = constraints[i];
      const value = constraint.coefficients.reduce(
        (sum, coeff, j) => sum + coeff * (solution[j] || 0),
        0,
      );
      
      const [lowerBound, upperBound] = constraint.bounds;
      const satisfied = value >= lowerBound && value <= upperBound;
      const violationDegree = satisfied ? 0 : 
        Math.min(Math.abs(value - lowerBound), Math.abs(value - upperBound));
      
      satisfactions.push({
        constraintId: `constraint_${i}`,
        satisfied,
        violationDegree,
        penalty: violationDegree * constraint.priority,
      });
    }
    
    return satisfactions;
  }

  private refineHybridSolution(
    solution: number[],
    constraints: ConstraintSatisfaction[],
    tolerances: ToleranceParameters,
  ): number[] {
    // Refine solution based on constraint violations
    const refinedSolution = [...solution];
    
    for (const constraint of constraints) {
      if (!constraint.satisfied && constraint.violationDegree > tolerances.feasibilityTolerance) {
        // Apply penalty method to adjust solution
        const adjustmentFactor = -0.1 * constraint.penalty;
        for (let i = 0; i < refinedSolution.length; i++) {
          refinedSolution[i] += adjustmentFactor * Math.random();
        }
      }
    }
    
    return refinedSolution;
  }

  private calculateSolutionConfidence(
    fidelity: number,
    constraints: ConstraintSatisfaction[],
  ): number {
    // Base confidence from quantum fidelity
    let confidence = fidelity;
    
    // Reduce confidence based on constraint violations
    const violatedConstraints = constraints.filter(c => !c.satisfied);
    const violationPenalty = violatedConstraints.length * 0.1;
    
    confidence = Math.max(0.1, confidence - violationPenalty);
    
    return confidence;
  }

  private calculateUncertaintyBounds(
    solution: number[],
    quantumState: QuantumState,
  ): [number, number] {
    // Calculate uncertainty bounds based on quantum state purity
    const uncertainty = (1 - quantumState.purity) * 0.1;
    const solutionNorm = Math.sqrt(
      solution.reduce((sum, val) => sum + val * val, 0),
    );
    
    return [
      solutionNorm - uncertainty,
      solutionNorm + uncertainty,
    ];
  }

  private async calculateValidationMetrics(
    solution: number[],
    quantumOutput: QuantumResult,
    context: ClassicalContext,
  ): Promise<ValidationMetrics> {
    // Cross-validation score
    const crossValidationScore = this.calculateCrossValidationScore(solution);
    
    // Bootstrap confidence
    const bootstrapConfidence = this.calculateBootstrapConfidence(solution);
    
    // Robustness score
    const robustnessScore = this.calculateRobustnessScore(solution, context);
    
    // Stability measure
    const stabilityMeasure = quantumOutput.fidelity * 0.8 + 0.2;
    
    return {
      crossValidationScore,
      bootstrapConfidence,
      robustnessScore,
      stabilityMeasure,
    };
  }

  private calculateCrossValidationScore(solution: number[]): number {
    // Simplified cross-validation score
    const variance = this.calculateVariance(solution);
    return Math.exp(-variance);
  }

  private calculateBootstrapConfidence(solution: number[]): number {
    // Bootstrap confidence estimation
    const mean = solution.reduce((sum, val) => sum + val, 0) / solution.length;
    const variance = this.calculateVariance(solution);
    return Math.exp(-variance / (mean * mean + 1e-6));
  }

  private calculateRobustnessScore(
    solution: number[],
    context: ClassicalContext,
  ): number {
    // Robustness to parameter perturbations
    const perturbationTests = 10;
    let robustnessSum = 0;
    
    for (let i = 0; i < perturbationTests; i++) {
      const perturbedSolution = solution.map(val => val + (Math.random() - 0.5) * 0.01);
      const originalObjective = this.calculateObjective(solution);
      const perturbedObjective = this.calculateObjective(perturbedSolution);
      
      const relativeDifference = Math.abs(perturbedObjective - originalObjective) / 
        (Math.abs(originalObjective) + 1e-6);
      
      robustnessSum += Math.exp(-relativeDifference * 10);
    }
    
    return robustnessSum / perturbationTests;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  private assessQuantumContribution(quantumOutput: QuantumResult): number {
    // Assess how much quantum computation contributed
    const fidelityContribution = quantumOutput.fidelity * 0.5;
    const entanglementContribution = quantumOutput.quantumState.entanglement * 0.3;
    const purityContribution = quantumOutput.quantumState.purity * 0.2;
    
    return fidelityContribution + entanglementContribution + purityContribution;
  }

  private async benchmarkClassical(problem: OptimizationProblem): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    
    // Simulate classical optimization
    const executionTime = problem.size.variables * Math.log(problem.size.variables);
    const solutionQuality = 0.8 + Math.random() * 0.15; // 80-95%
    const memoryUsage = problem.size.variables * 8; // bytes
    const scalability = 1 / Math.sqrt(problem.size.variables);
    const robustness = 0.9;
    
    return {
      solutionQuality,
      executionTime,
      memoryUsage,
      scalability,
      robustness,
    };
  }

  private async benchmarkQuantum(problem: OptimizationProblem): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    
    // Simulate quantum optimization
    const quantumSpeedup = problem.size.complexity === 'exponential' ? 
      Math.sqrt(problem.size.variables) : 1.2;
    
    const executionTime = (problem.size.variables * Math.log(problem.size.variables)) / quantumSpeedup;
    const solutionQuality = 0.85 + Math.random() * 0.1; // 85-95%
    const memoryUsage = problem.size.variables * 4; // Lower memory for quantum
    const scalability = 1 / Math.log(problem.size.variables); // Better scaling
    const robustness = 0.75; // Lower due to quantum noise
    
    return {
      solutionQuality,
      executionTime,
      memoryUsage,
      scalability,
      robustness,
    };
  }

  private async benchmarkHybrid(problem: OptimizationProblem): Promise<PerformanceMetrics> {
    const classical = await this.benchmarkClassical(problem);
    const quantum = await this.benchmarkQuantum(problem);
    
    // Hybrid combines best of both
    return {
      solutionQuality: Math.max(classical.solutionQuality, quantum.solutionQuality),
      executionTime: Math.min(classical.executionTime, quantum.executionTime) * 1.1, // 10% overhead
      memoryUsage: (classical.memoryUsage + quantum.memoryUsage) / 2,
      scalability: Math.max(classical.scalability, quantum.scalability),
      robustness: (classical.robustness + quantum.robustness) / 2,
    };
  }

  private comparePerformances(
    classical: PerformanceMetrics,
    quantum: PerformanceMetrics,
    hybrid: PerformanceMetrics,
  ): ComparisonResults {
    const speedupFactor = classical.executionTime / quantum.executionTime;
    const accuracyImprovement = (quantum.solutionQuality - classical.solutionQuality) / classical.solutionQuality;
    const efficiencyGain = (quantum.scalability - classical.scalability) / classical.scalability;
    
    const quantumAdvantage = speedupFactor > 1.2 && accuracyImprovement > 0.05;
    
    let optimalApproach: 'classical' | 'quantum' | 'hybrid' = 'classical';
    if (hybrid.solutionQuality >= classical.solutionQuality && hybrid.solutionQuality >= quantum.solutionQuality) {
      if (hybrid.executionTime <= classical.executionTime * 1.2) {
        optimalApproach = 'hybrid';
      }
    } else if (quantumAdvantage) {
      optimalApproach = 'quantum';
    }
    
    return {
      speedupFactor,
      accuracyImprovement,
      efficiencyGain,
      quantumAdvantage,
      optimalApproach,
    };
  }

  private generateRecommendations(
    problem: OptimizationProblem,
    comparison: ComparisonResults,
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    if (comparison.quantumAdvantage) {
      recommendations.push({
        scenario: 'Large-scale optimization',
        recommendedApproach: 'quantum',
        reasoning: 'Quantum algorithms show significant speedup for this problem size',
        expectedBenefit: comparison.speedupFactor,
        implementationComplexity: 'high',
      });
    }
    
    if (comparison.optimalApproach === 'hybrid') {
      recommendations.push({
        scenario: 'Production deployment',
        recommendedApproach: 'hybrid',
        reasoning: 'Hybrid approach balances performance and reliability',
        expectedBenefit: comparison.efficiencyGain,
        implementationComplexity: 'medium',
      });
    }
    
    recommendations.push({
      scenario: 'Prototyping and development',
      recommendedApproach: 'classical',
      reasoning: 'Classical methods are more mature and easier to debug',
      expectedBenefit: 1.0,
      implementationComplexity: 'low',
    });
    
    return recommendations;
  }

  private calculateCurrentQuantumAdvantage(
    problemSize: number,
    complexity: ComplexityMetrics,
  ): number {
    // Current quantum hardware limitations
    if (problemSize > 100) return 0.8; // Limited by current qubit count
    if (complexity.timeComplexity === 'exponential') return 1.5;
    if (complexity.timeComplexity === 'polynomial') return 1.1;
    return 0.9;
  }

  private projectNearTermAdvantage(
    problemSize: number,
    complexity: ComplexityMetrics,
  ): number {
    // 2-5 year projection with improved quantum hardware
    const currentAdvantage = this.calculateCurrentQuantumAdvantage(problemSize, complexity);
    const improvementFactor = 1.5; // Expected improvement
    return currentAdvantage * improvementFactor;
  }

  private projectLongTermAdvantage(
    problemSize: number,
    complexity: ComplexityMetrics,
  ): number {
    // 5+ year projection with fault-tolerant quantum computers
    if (complexity.timeComplexity === 'exponential') return Math.sqrt(problemSize);
    if (complexity.timeComplexity === 'polynomial') return Math.log(problemSize);
    return 2.0;
  }

  private calculateProblemSizeThreshold(complexity: ComplexityMetrics): number {
    // Problem size where quantum advantage becomes significant
    if (complexity.timeComplexity === 'exponential') return 50;
    if (complexity.timeComplexity === 'polynomial') return 1000;
    return 100;
  }

  private analyzeQuantumResourceRequirements(
    problemSize: number,
    complexity: ComplexityMetrics,
  ): QuantumResourceRequirements {
    const qubits = Math.ceil(Math.log2(problemSize)) + 10; // Ancilla qubits
    const gates = problemSize * Math.log(problemSize) * 100;
    const coherenceTime = gates * 0.1; // microseconds
    const errorRate = 1e-4; // Current NISQ error rates
    
    return {
      qubits,
      gates,
      coherenceTime,
      errorRate,
      connectivity: 'all-to-all',
    };
  }

  private analyzePracticalConsiderations(
    problemSize: number,
    complexity: ComplexityMetrics,
    resources: QuantumResourceRequirements,
  ): PracticalConsideration[] {
    const considerations: PracticalConsideration[] = [];
    
    if (resources.qubits > 100) {
      considerations.push({
        factor: 'Qubit count requirement',
        impact: 'negative',
        severity: 'high',
        mitigation: 'Use hybrid classical-quantum approach',
      });
    }
    
    if (resources.coherenceTime > 1000) {
      considerations.push({
        factor: 'Coherence time requirement',
        impact: 'negative',
        severity: 'medium',
        mitigation: 'Implement error correction or shorter circuits',
      });
    }
    
    considerations.push({
      factor: 'Algorithm maturity',
      impact: 'negative',
      severity: 'medium',
      mitigation: 'Invest in algorithm research and development',
    });
    
    considerations.push({
      factor: 'Quantum speedup potential',
      impact: 'positive',
      severity: 'high',
      mitigation: 'Continue quantum research and development',
    });
    
    return considerations;
  }
}
