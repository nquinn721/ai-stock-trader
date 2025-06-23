import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface DatasetVersion {
  id: string;
  name: string;
  version: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  hash: string;
  size: number;
  recordCount: number;
  schema: any;
  tags: string[];
  parentVersion?: string;
  metadata: Record<string, any>;
}

export interface FeatureLineage {
  featureName: string;
  sourceDatasets: string[];
  transformations: string[];
  dependencies: string[];
  version: string;
  computationGraph: any;
}

export interface DataProvenance {
  datasetId: string;
  version: string;
  sourceData: {
    type: string;
    source: string;
    timestamp: Date;
    version?: string;
  }[];
  transformations: {
    operation: string;
    parameters: any;
    timestamp: Date;
    version: string;
  }[];
  lineage: FeatureLineage[];
}

@Injectable()
export class DataVersioningService {
  private readonly logger = new Logger(DataVersioningService.name);

  constructor(
    // Note: In a real implementation, these would be proper TypeORM entities
    // For now, we'll use in-memory storage with the interface for future implementation
  ) {}

  /**
   * Create a new dataset version
   */
  async createDatasetVersion(dataset: Partial<DatasetVersion>): Promise<DatasetVersion> {
    this.logger.log(`Creating dataset version: ${dataset.name} v${dataset.version}`);

    const version: DatasetVersion = {
      id: this.generateVersionId(),
      name: dataset.name || 'unnamed_dataset',
      version: dataset.version || '1.0.0',
      description: dataset.description || '',
      createdAt: new Date(),
      createdBy: dataset.createdBy || 'system',
      hash: this.generateDatasetHash(dataset),
      size: dataset.size || 0,
      recordCount: dataset.recordCount || 0,
      schema: dataset.schema || {},
      tags: dataset.tags || [],
      parentVersion: dataset.parentVersion,
      metadata: dataset.metadata || {},
    };

    // In production, this would save to database
    this.logger.log(`Dataset version created: ${version.id}`);

    return version;
  }

  /**
   * Get dataset version by ID
   */
  async getDatasetVersion(versionId: string): Promise<DatasetVersion | null> {
    this.logger.log(`Retrieving dataset version: ${versionId}`);

    // In production, this would query from database
    // For now, return a mock version for testing
    if (versionId.startsWith('mock')) {
      return {
        id: versionId,
        name: 'market_data',
        version: '1.0.0',
        description: 'Historical market data with technical indicators',
        createdAt: new Date(),
        createdBy: 'system',
        hash: 'abc123def456',
        size: 1024000,
        recordCount: 50000,
        schema: {
          columns: ['symbol', 'timestamp', 'open', 'high', 'low', 'close', 'volume'],
          types: ['string', 'datetime', 'float', 'float', 'float', 'float', 'integer']
        },
        tags: ['market-data', 'technical-indicators'],
        metadata: {
          source: 'yahoo-finance',
          timeframe: '1d',
          symbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
        }
      };
    }

    return null;
  }

  /**
   * List all versions of a dataset
   */
  async listDatasetVersions(datasetName: string): Promise<DatasetVersion[]> {
    this.logger.log(`Listing versions for dataset: ${datasetName}`);

    // In production, this would query from database
    return [
      await this.getDatasetVersion('mock_v1'),
      {
        id: 'mock_v2',
        name: datasetName,
        version: '2.0.0',
        description: 'Enhanced market data with additional indicators',
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        createdBy: 'ml-team',
        hash: 'def456ghi789',
        size: 2048000,
        recordCount: 75000,
        schema: {
          columns: ['symbol', 'timestamp', 'open', 'high', 'low', 'close', 'volume', 'sma_20', 'rsi'],
          types: ['string', 'datetime', 'float', 'float', 'float', 'float', 'integer', 'float', 'float']
        },
        tags: ['market-data', 'technical-indicators', 'enhanced'],
        parentVersion: 'mock_v1',
        metadata: {
          source: 'yahoo-finance',
          timeframe: '1d',
          symbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'],
          indicators: ['sma_20', 'rsi']
        }
      }
    ].filter(v => v !== null) as DatasetVersion[];
  }

  /**
   * Track feature lineage
   */
  async trackFeatureLineage(lineage: FeatureLineage): Promise<void> {
    this.logger.log(`Tracking lineage for feature: ${lineage.featureName}`);

    // In production, this would save lineage information to database
    this.logger.log(`Feature lineage tracked: ${JSON.stringify(lineage, null, 2)}`);
  }

  /**
   * Get feature lineage
   */
  async getFeatureLineage(featureName: string, version?: string): Promise<FeatureLineage | null> {
    this.logger.log(`Retrieving lineage for feature: ${featureName} v${version || 'latest'}`);

    // Mock lineage for testing
    return {
      featureName,
      sourceDatasets: ['market_data_v1', 'volume_data_v1'],
      transformations: ['calculate_sma', 'normalize'],
      dependencies: ['close_price', 'volume'],
      version: version || '1.0.0',
      computationGraph: {
        nodes: [
          { id: 'close_price', type: 'source' },
          { id: 'sma_20', type: 'transform', operation: 'simple_moving_average', window: 20 }
        ],
        edges: [
          { from: 'close_price', to: 'sma_20' }
        ]
      }
    };
  }

  /**
   * Record data provenance
   */
  async recordDataProvenance(provenance: DataProvenance): Promise<void> {
    this.logger.log(`Recording provenance for dataset: ${provenance.datasetId} v${provenance.version}`);

    // In production, this would save provenance information to database
    this.logger.log(`Data provenance recorded: ${JSON.stringify(provenance, null, 2)}`);
  }

  /**
   * Get data provenance
   */
  async getDataProvenance(datasetId: string, version: string): Promise<DataProvenance | null> {
    this.logger.log(`Retrieving provenance for dataset: ${datasetId} v${version}`);

    // Mock provenance for testing
    return {
      datasetId,
      version,
      sourceData: [
        {
          type: 'api',
          source: 'yahoo-finance',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          version: '2.1.0'
        }
      ],
      transformations: [
        {
          operation: 'feature_engineering',
          parameters: { indicators: ['sma', 'rsi', 'macd'] },
          timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
          version: '1.0.0'
        }
      ],
      lineage: [
        await this.getFeatureLineage('sma_20', version),
        await this.getFeatureLineage('rsi', version)
      ].filter(Boolean) as FeatureLineage[]
    };
  }

  /**
   * Compare dataset versions
   */
  async compareVersions(versionId1: string, versionId2: string): Promise<any> {
    this.logger.log(`Comparing versions: ${versionId1} vs ${versionId2}`);

    const version1 = await this.getDatasetVersion(versionId1);
    const version2 = await this.getDatasetVersion(versionId2);

    if (!version1 || !version2) {
      throw new Error('One or both versions not found');
    }

    return {
      schemaChanges: this.compareSchemas(version1.schema, version2.schema),
      sizeChange: version2.size - version1.size,
      recordCountChange: version2.recordCount - version1.recordCount,
      tagChanges: {
        added: version2.tags.filter(tag => !version1.tags.includes(tag)),
        removed: version1.tags.filter(tag => !version2.tags.includes(tag))
      },
      metadataChanges: this.compareMetadata(version1.metadata, version2.metadata)
    };
  }

  /**
   * Create dataset rollback
   */
  async rollbackToVersion(datasetName: string, targetVersion: string): Promise<DatasetVersion> {
    this.logger.log(`Rolling back dataset ${datasetName} to version: ${targetVersion}`);

    const targetVersionData = await this.getDatasetVersion(targetVersion);
    if (!targetVersionData) {
      throw new Error(`Target version ${targetVersion} not found`);
    }

    // Create new version based on target version
    const rollbackVersion = await this.createDatasetVersion({
      ...targetVersionData,
      version: this.incrementVersion(targetVersionData.version),
      description: `Rollback to version ${targetVersion}`,
      parentVersion: targetVersion,
      metadata: {
        ...targetVersionData.metadata,
        rollback: true,
        rollbackTarget: targetVersion,
        rollbackTimestamp: new Date()
      }
    });

    this.logger.log(`Rollback completed. New version: ${rollbackVersion.id}`);

    return rollbackVersion;
  }

  /**
   * Validate version compatibility for experiments
   */
  async validateVersionCompatibility(baselineVersion: string, comparisonVersion: string): Promise<boolean> {
    this.logger.log(`Validating compatibility between versions: ${baselineVersion} and ${comparisonVersion}`);

    const baseline = await this.getDatasetVersion(baselineVersion);
    const comparison = await this.getDatasetVersion(comparisonVersion);

    if (!baseline || !comparison) {
      return false;
    }

    // Check schema compatibility
    const schemaCompatible = this.areSchemaCompatible(baseline.schema, comparison.schema);
    
    // Check feature compatibility
    const featureCompatible = await this.areFeatureCompatible(baselineVersion, comparisonVersion);

    const compatible = schemaCompatible && featureCompatible;
    this.logger.log(`Version compatibility result: ${compatible}`);

    return compatible;
  }

  /**
   * Get dataset impact analysis
   */
  async getDatasetImpactAnalysis(datasetId: string): Promise<any> {
    this.logger.log(`Analyzing impact for dataset: ${datasetId}`);

    // Mock impact analysis
    return {
      affectedModels: ['trading_model_v1', 'risk_model_v2'],
      affectedExperiments: ['exp_001', 'exp_002'],
      affectedFeatures: ['sma_20', 'rsi', 'macd'],
      downstreamDatasets: ['processed_features_v1', 'training_data_v1'],
      estimatedReprocessingTime: '2 hours',
      riskLevel: 'medium'
    };
  }

  // Private helper methods

  private generateVersionId(): string {
    return `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDatasetHash(dataset: any): string {
    // In production, this would generate a proper hash of the dataset content
    const content = JSON.stringify(dataset);
    return content.length.toString(16) + '_' + Date.now().toString(16);
  }

  private compareSchemas(schema1: any, schema2: any): any {
    if (!schema1 || !schema2) return { changed: false };

    return {
      changed: JSON.stringify(schema1) !== JSON.stringify(schema2),
      columnsAdded: (schema2.columns || []).filter(col => !(schema1.columns || []).includes(col)),
      columnsRemoved: (schema1.columns || []).filter(col => !(schema2.columns || []).includes(col)),
      typeChanges: this.findTypeChanges(schema1, schema2)
    };
  }

  private compareMetadata(metadata1: any, metadata2: any): any {
    const keys1 = Object.keys(metadata1 || {});
    const keys2 = Object.keys(metadata2 || {});

    return {
      keysAdded: keys2.filter(key => !keys1.includes(key)),
      keysRemoved: keys1.filter(key => !keys2.includes(key)),
      valuesChanged: keys1.filter(key => 
        keys2.includes(key) && 
        JSON.stringify(metadata1[key]) !== JSON.stringify(metadata2[key])
      )
    };
  }
  private findTypeChanges(schema1: any, schema2: any): Array<{column: string, from: string, to: string}> {
    const changes: Array<{column: string, from: string, to: string}> = [];
    const columns1 = schema1.columns || [];
    const types1 = schema1.types || [];
    const columns2 = schema2.columns || [];
    const types2 = schema2.types || [];

    for (let i = 0; i < Math.min(columns1.length, columns2.length); i++) {
      if (columns1[i] === columns2[i] && types1[i] !== types2[i]) {
        changes.push({
          column: columns1[i],
          from: types1[i],
          to: types2[i]
        });
      }
    }

    return changes;
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private areSchemaCompatible(schema1: any, schema2: any): boolean {
    if (!schema1 || !schema2) return false;

    const columns1 = new Set(schema1.columns || []);
    const columns2 = new Set(schema2.columns || []);

    // Check if all required columns are present
    const requiredColumns = Array.from(columns1);
    return requiredColumns.every(col => columns2.has(col));
  }

  private async areFeatureCompatible(version1: string, version2: string): Promise<boolean> {
    // In production, this would check feature compatibility
    // For now, return true for mock implementation
    return true;
  }
}
