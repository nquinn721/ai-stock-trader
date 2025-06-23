import { Injectable, Logger } from '@nestjs/common';

export interface DatasetVersion {
  id: string;
  name: string;
  version: string;
  description?: string;
  createdAt: Date;
  dataPath: string;
  schemaHash: string;
  metadata: Record<string, any>;
  size: number;
  rowCount?: number;
  columnCount?: number;
  tags: string[];
}

export interface DataVersionMetrics {
  totalVersions: number;
  totalSize: number;
  latestVersion: string;
  createdToday: number;
  averageSize: number;
}

@Injectable()
export class DataVersioningService {
  private readonly logger = new Logger(DataVersioningService.name);
  private readonly versions = new Map<string, DatasetVersion[]>();

  /**
   * Create a new version of a dataset
   */
  async createDatasetVersion(versionData: {
    datasetName: string;
    version?: string;
    description?: string;
    dataPath: string;
    metadata?: Record<string, any>;
    size: number;
    rowCount?: number;
    columnCount?: number;
    tags?: string[];
  }): Promise<DatasetVersion> {
    this.logger.log(
      `Creating new version for dataset: ${versionData.datasetName}`,
    );

    const version: DatasetVersion = {
      id: this.generateVersionId(),
      name: versionData.datasetName,
      version:
        versionData.version ||
        this.generateVersionNumber(versionData.datasetName),
      description: versionData.description,
      createdAt: new Date(),
      dataPath: versionData.dataPath,
      schemaHash: this.generateSchemaHash(versionData.metadata || {}),
      metadata: versionData.metadata || {},
      size: versionData.size,
      rowCount: versionData.rowCount,
      columnCount: versionData.columnCount,
      tags: versionData.tags || [],
    };

    // Store version
    if (!this.versions.has(versionData.datasetName)) {
      this.versions.set(versionData.datasetName, []);
    }
    this.versions.get(versionData.datasetName)!.push(version);

    this.logger.log(
      `Created version ${version.version} for dataset ${versionData.datasetName}`,
    );
    return version;
  }

  /**
   * Get all versions of a dataset
   */
  async getDatasetVersions(datasetName: string): Promise<DatasetVersion[]> {
    const versions = this.versions.get(datasetName) || [];
    return versions.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  /**
   * Get a specific version of a dataset
   */
  async getDatasetVersion(
    datasetName: string,
    version: string,
  ): Promise<DatasetVersion | null> {
    const versions = this.versions.get(datasetName) || [];
    return versions.find((v) => v.version === version) || null;
  }

  /**
   * Get the latest version of a dataset
   */
  async getLatestVersion(datasetName: string): Promise<DatasetVersion | null> {
    const versions = await this.getDatasetVersions(datasetName);
    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * Compare two versions of a dataset
   */
  async compareVersions(
    datasetName: string,
    version1: string,
    version2: string,
  ): Promise<{
    version1: DatasetVersion;
    version2: DatasetVersion;
    differences: {
      sizeChange: number;
      rowCountChange?: number;
      columnCountChange?: number;
      schemaChanged: boolean;
      metadataChanges: string[];
      tagChanges: {
        added: string[];
        removed: string[];
      };
    };
  } | null> {
    const v1 = await this.getDatasetVersion(datasetName, version1);
    const v2 = await this.getDatasetVersion(datasetName, version2);

    if (!v1 || !v2) {
      return null;
    }

    const differences = {
      sizeChange: v2.size - v1.size,
      rowCountChange:
        v2.rowCount && v1.rowCount ? v2.rowCount - v1.rowCount : undefined,
      columnCountChange:
        v2.columnCount && v1.columnCount
          ? v2.columnCount - v1.columnCount
          : undefined,
      schemaChanged: v1.schemaHash !== v2.schemaHash,
      metadataChanges: this.getMetadataChanges(v1.metadata, v2.metadata),
      tagChanges: {
        added: v2.tags.filter((tag) => !v1.tags.includes(tag)),
        removed: v1.tags.filter((tag) => !v2.tags.includes(tag)),
      },
    };

    return {
      version1: v1,
      version2: v2,
      differences,
    };
  }

  /**
   * Delete a dataset version
   */
  async deleteDatasetVersion(
    datasetName: string,
    version: string,
  ): Promise<boolean> {
    const versions = this.versions.get(datasetName);
    if (!versions) {
      return false;
    }

    const index = versions.findIndex((v) => v.version === version);
    if (index === -1) {
      return false;
    }

    versions.splice(index, 1);
    this.logger.log(`Deleted version ${version} of dataset ${datasetName}`);
    return true;
  }

  /**
   * Tag a dataset version
   */
  async tagDatasetVersion(
    datasetName: string,
    version: string,
    tags: string[],
  ): Promise<DatasetVersion | null> {
    const datasetVersion = await this.getDatasetVersion(datasetName, version);
    if (!datasetVersion) {
      return null;
    }

    // Add new tags without duplicates
    const uniqueTags = [...new Set([...datasetVersion.tags, ...tags])];
    datasetVersion.tags = uniqueTags;

    this.logger.log(
      `Added tags ${tags.join(', ')} to version ${version} of dataset ${datasetName}`,
    );
    return datasetVersion;
  }

  /**
   * Get versioning metrics
   */
  async getVersioningMetrics(): Promise<DataVersionMetrics> {
    let totalVersions = 0;
    let totalSize = 0;
    let createdToday = 0;
    let latestVersion = '';
    let latestDate = new Date(0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const [datasetName, versions] of this.versions.entries()) {
      totalVersions += versions.length;

      for (const version of versions) {
        totalSize += version.size;

        // Check if created today
        const versionDate = new Date(version.createdAt);
        versionDate.setHours(0, 0, 0, 0);
        if (versionDate.getTime() === today.getTime()) {
          createdToday++;
        }

        // Track latest version across all datasets
        if (version.createdAt > latestDate) {
          latestDate = version.createdAt;
          latestVersion = `${datasetName}:${version.version}`;
        }
      }
    }

    return {
      totalVersions,
      totalSize,
      latestVersion,
      createdToday,
      averageSize: totalVersions > 0 ? totalSize / totalVersions : 0,
    };
  }

  /**
   * Clean up old versions (keep only latest N versions per dataset)
   */
  async cleanupOldVersions(keepCount: number = 10): Promise<{
    deleted: number;
    datasets: string[];
  }> {
    let totalDeleted = 0;
    const affectedDatasets: string[] = [];

    for (const [datasetName, versions] of this.versions.entries()) {
      if (versions.length > keepCount) {
        // Sort by creation date (newest first)
        versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Keep only the latest versions
        const toDelete = versions.splice(keepCount);
        totalDeleted += toDelete.length;
        affectedDatasets.push(datasetName);

        this.logger.log(
          `Cleaned up ${toDelete.length} old versions for dataset ${datasetName}`,
        );
      }
    }

    return {
      deleted: totalDeleted,
      datasets: affectedDatasets,
    };
  }

  private generateVersionId(): string {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVersionNumber(datasetName: string): string {
    const versions = this.versions.get(datasetName) || [];
    const versionNumbers = versions
      .map((v) => parseInt(v.version.replace(/^v?/, '')) || 0)
      .filter((n) => !isNaN(n));

    const nextNumber =
      versionNumbers.length > 0 ? Math.max(...versionNumbers) + 1 : 1;
    return `v${nextNumber}`;
  }

  private generateSchemaHash(metadata: Record<string, any>): string {
    const schemaString = JSON.stringify(metadata, Object.keys(metadata).sort());
    return Buffer.from(schemaString).toString('base64').substring(0, 16);
  }

  private getMetadataChanges(
    oldMetadata: Record<string, any>,
    newMetadata: Record<string, any>,
  ): string[] {
    const changes: string[] = [];
    const allKeys = new Set([
      ...Object.keys(oldMetadata),
      ...Object.keys(newMetadata),
    ]);

    for (const key of allKeys) {
      if (!(key in oldMetadata)) {
        changes.push(`Added: ${key}`);
      } else if (!(key in newMetadata)) {
        changes.push(`Removed: ${key}`);
      } else if (
        JSON.stringify(oldMetadata[key]) !== JSON.stringify(newMetadata[key])
      ) {
        changes.push(`Modified: ${key}`);
      }
    }

    return changes;
  }
}
