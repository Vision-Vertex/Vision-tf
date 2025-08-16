import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface FileUploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  cloudUrl?: string;
}

export interface FileDownloadResult {
  filePath: string;
  fileName: string;
  stream?: NodeJS.ReadableStream;
}

export interface StorageConfig {
  type: 'local' | 's3' | 'gcs' | 'azure';
  localPath?: string;
  s3Config?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  gcsConfig?: {
    bucket: string;
    projectId: string;
    keyFilename: string;
  };
  azureConfig?: {
    accountName: string;
    accountKey: string;
    containerName: string;
  };
}

@Injectable()
export class CloudStorageService {
  private config: StorageConfig;
  private isCloudStorage: boolean;

  constructor() {
    // Initialize with local storage by default
    this.config = {
      type: 'local',
      localPath: './uploads',
    };
    this.isCloudStorage = false;
  }

  /**
   * Initialize storage configuration
   */
  initialize(config: StorageConfig): void {
    this.config = config;
    this.isCloudStorage = config.type !== 'local';

    if (config.type === 'local' && config.localPath) {
      this.ensureDirectory(config.localPath);
    }
  }

  /**
   * Upload file to storage
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    directory: string = 'certifications',
  ): Promise<FileUploadResult> {
    try {
      if (this.isCloudStorage) {
        return await this.uploadToCloud(file, fileName, directory);
      } else {
        return await this.uploadToLocal(file, fileName, directory);
      }
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload file: ${error.message}`,
      );
    }
  }

  /**
   * Download file from storage
   */
  async downloadFile(fileUrl: string): Promise<FileDownloadResult> {
    try {
      if (this.isCloudStorage) {
        return await this.downloadFromCloud(fileUrl);
      } else {
        return await this.downloadFromLocal(fileUrl);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to download file: ${error.message}`,
      );
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (this.isCloudStorage) {
        await this.deleteFromCloud(fileUrl);
      } else {
        await this.deleteFromLocal(fileUrl);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Failed to delete file:', error);
      // Don't throw error as file deletion is not critical
    }
  }

  /**
   * Get public URL for file (for cloud storage)
   */
  async getPublicUrl(fileUrl: string): Promise<string> {
    if (this.isCloudStorage) {
      return await this.getCloudPublicUrl(fileUrl);
    } else {
      // For local storage, return the file path
      return fileUrl;
    }
  }

  /**
   * Migrate file from local to cloud storage
   */
  async migrateToCloud(
    localFileUrl: string,
    targetDirectory: string = 'certifications',
  ): Promise<string> {
    if (!this.isCloudStorage) {
      throw new BadRequestException('Cloud storage not configured');
    }

    try {
      // Read local file
      const fileBuffer = fs.readFileSync(localFileUrl);
      const fileName = path.basename(localFileUrl);

      // Upload to cloud
      const uploadResult = await this.uploadToCloud(
        fileBuffer,
        fileName,
        targetDirectory,
      );

      // Delete local file after successful upload
      await this.deleteFromLocal(localFileUrl);

      return uploadResult.fileUrl;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to migrate file to cloud: ${error.message}`,
      );
    }
  }

  /**
   * Migrate file from cloud to local storage
   */
  async migrateToLocal(
    cloudFileUrl: string,
    targetDirectory: string = 'certifications',
  ): Promise<string> {
    if (this.isCloudStorage) {
      throw new BadRequestException('Already using cloud storage');
    }

    try {
      // Download from cloud
      const downloadResult = await this.downloadFromCloud(cloudFileUrl);

      // Save to local
      const localPath = path.join(
        this.config.localPath!,
        targetDirectory,
        path.basename(cloudFileUrl),
      );
      this.ensureDirectory(path.dirname(localPath));
      fs.writeFileSync(localPath, downloadResult.stream);

      // Delete from cloud after successful download
      await this.deleteFromCloud(cloudFileUrl);

      return localPath;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to migrate file to local: ${error.message}`,
      );
    }
  }

  /**
   * Batch migrate files
   */
  async batchMigrateToCloud(
    fileUrls: string[],
    targetDirectory: string = 'certifications',
  ): Promise<string[]> {
    const results: string[] = [];

    for (const fileUrl of fileUrls) {
      try {
        const newUrl = await this.migrateToCloud(fileUrl, targetDirectory);
        results.push(newUrl);
      } catch (error) {
        console.error(`Failed to migrate file ${fileUrl}:`, error);
        results.push(fileUrl); // Keep original URL if migration fails
      }
    }

    return results;
  }

  /**
   * Upload to local storage
   */
  private async uploadToLocal(
    file: Buffer,
    fileName: string,
    directory: string,
  ): Promise<FileUploadResult> {
    const uploadDir = path.join(this.config.localPath!, directory);
    await this.ensureDirectoryAsync(uploadDir);

    const uniqueFileName = `${Date.now()}_${fileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // Use async file operations to prevent blocking
    await fs.promises.writeFile(filePath, file);

    return {
      fileUrl: filePath,
      fileName: fileName,
      fileSize: file.length,
    };
  }

  /**
   * Upload to cloud storage (placeholder implementation)
   */
  private async uploadToCloud(
    file: Buffer,
    fileName: string,
    directory: string,
  ): Promise<FileUploadResult> {
    // This is a placeholder implementation
    // In a real implementation, you would integrate with AWS S3, Google Cloud Storage, or Azure Blob Storage

    switch (this.config.type) {
      case 's3':
        return await this.uploadToS3(file, fileName, directory);
      case 'gcs':
        return await this.uploadToGCS(file, fileName, directory);
      case 'azure':
        return await this.uploadToAzure(file, fileName, directory);
      default:
        throw new BadRequestException('Unsupported cloud storage type');
    }
  }

  /**
   * Download from local storage
   */
  private async downloadFromLocal(
    fileUrl: string,
  ): Promise<FileDownloadResult> {
    try {
      await fs.promises.access(fileUrl, fs.constants.F_OK);
    } catch {
      throw new BadRequestException('File not found');
    }

    return {
      filePath: fileUrl,
      fileName: path.basename(fileUrl),
    };
  }

  /**
   * Download from cloud storage (placeholder implementation)
   */
  private async downloadFromCloud(
    fileUrl: string,
  ): Promise<FileDownloadResult> {
    // This is a placeholder implementation
    // In a real implementation, you would download from the cloud storage

    switch (this.config.type) {
      case 's3':
        return await this.downloadFromS3(fileUrl);
      case 'gcs':
        return await this.downloadFromGCS(fileUrl);
      case 'azure':
        return await this.downloadFromAzure(fileUrl);
      default:
        throw new BadRequestException('Unsupported cloud storage type');
    }
  }

  /**
   * Delete from local storage
   */
  private async deleteFromLocal(fileUrl: string): Promise<void> {
    try {
      await fs.promises.access(fileUrl, fs.constants.F_OK);
      await fs.promises.unlink(fileUrl);
    } catch (error) {
      // File doesn't exist or can't be deleted, which is fine
      console.warn(
        `File ${fileUrl} not found or cannot be deleted:`,
        error.message,
      );
    }
  }

  /**
   * Delete from cloud storage (placeholder implementation)
   */
  private async deleteFromCloud(fileUrl: string): Promise<void> {
    // This is a placeholder implementation
    // In a real implementation, you would delete from the cloud storage

    switch (this.config.type) {
      case 's3':
        await this.deleteFromS3(fileUrl);
        break;
      case 'gcs':
        await this.deleteFromGCS(fileUrl);
        break;
      case 'azure':
        await this.deleteFromAzure(fileUrl);
        break;
      default:
        throw new BadRequestException('Unsupported cloud storage type');
    }
  }

  /**
   * Get cloud public URL (placeholder implementation)
   */
  private async getCloudPublicUrl(fileUrl: string): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, you would generate a public URL for the cloud storage

    switch (this.config.type) {
      case 's3':
        return this.getS3PublicUrl(fileUrl);
      case 'gcs':
        return this.getGCSPublicUrl(fileUrl);
      case 'azure':
        return this.getAzurePublicUrl(fileUrl);
      default:
        return fileUrl;
    }
  }

  /**
   * Ensure directory exists (sync version for backward compatibility)
   */
  private ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Ensure directory exists (async version)
   */
  private async ensureDirectoryAsync(dirPath: string): Promise<void> {
    try {
      await fs.promises.access(dirPath, fs.constants.F_OK);
    } catch {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }

  // Placeholder implementations for cloud storage providers
  // These would be replaced with actual SDK implementations

  private async uploadToS3(
    file: Buffer,
    fileName: string,
    directory: string,
  ): Promise<FileUploadResult> {
    // Implement AWS S3 upload
    throw new Error('S3 upload not implemented');
  }

  private async uploadToGCS(
    file: Buffer,
    fileName: string,
    directory: string,
  ): Promise<FileUploadResult> {
    // Implement Google Cloud Storage upload
    throw new Error('GCS upload not implemented');
  }

  private async uploadToAzure(
    file: Buffer,
    fileName: string,
    directory: string,
  ): Promise<FileUploadResult> {
    // Implement Azure Blob Storage upload
    throw new Error('Azure upload not implemented');
  }

  private async downloadFromS3(fileUrl: string): Promise<FileDownloadResult> {
    // Implement AWS S3 download
    throw new Error('S3 download not implemented');
  }

  private async downloadFromGCS(fileUrl: string): Promise<FileDownloadResult> {
    // Implement Google Cloud Storage download
    throw new Error('GCS download not implemented');
  }

  private async downloadFromAzure(
    fileUrl: string,
  ): Promise<FileDownloadResult> {
    // Implement Azure Blob Storage download
    throw new Error('Azure download not implemented');
  }

  private async deleteFromS3(fileUrl: string): Promise<void> {
    // Implement AWS S3 delete
    throw new Error('S3 delete not implemented');
  }

  private async deleteFromGCS(fileUrl: string): Promise<void> {
    // Implement Google Cloud Storage delete
    throw new Error('GCS delete not implemented');
  }

  private async deleteFromAzure(fileUrl: string): Promise<void> {
    // Implement Azure Blob Storage delete
    throw new Error('Azure delete not implemented');
  }

  private getS3PublicUrl(fileUrl: string): string {
    // Generate S3 public URL
    return fileUrl;
  }

  private getGCSPublicUrl(fileUrl: string): string {
    // Generate GCS public URL
    return fileUrl;
  }

  private getAzurePublicUrl(fileUrl: string): string {
    // Generate Azure public URL
    return fileUrl;
  }
}
