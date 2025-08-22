import { Injectable } from '@nestjs/common';

@Injectable()
export class JobTransformer {
  /**
   * Transform client information consistently
   */
  private transformClient(client: any) {
    if (!client) return null;
    
    return {
      id: client.id,
      name: `${client.firstname || ''} ${client.lastname || ''}`.trim() || 'Unknown',
      email: client.email || '',
    };
  }

  /**
   * Transform budget information consistently
   */
  private transformBudget(budget: any) {
    if (!budget || typeof budget !== 'object') return null;
    
    return {
      type: budget.type || 'UNKNOWN',
      amount: budget.amount || 0,
      currency: budget.currency || 'USD',
    };
  }

  /**
   * Transform skills information consistently
   */
  private transformSkills(skills: any) {
    if (!Array.isArray(skills)) return [];
    return skills.filter(skill => skill && typeof skill === 'object');
  }

  /**
   * Transform arrays safely
   */
  private transformArray(array: any) {
    if (!Array.isArray(array)) return [];
    return array.filter(item => item !== null && item !== undefined);
  }

  /**
   * Base transformation logic
   */
  private transformBase(job: any) {
    if (!job) return null;

    return {
      id: job.id || '',
      title: job.title || '',
      description: job.description || '',
      deadline: job.deadline || null,
      status: job.status || 'DRAFT',
      priority: job.priority || 'MEDIUM',
      projectType: job.projectType || null,
      location: job.location || 'REMOTE',
      estimatedHours: job.estimatedHours || null,
      tags: this.transformArray(job.tags),
      attachments: this.transformArray(job.attachments),
      requirements: job.requirements || null,
      deliverables: this.transformArray(job.deliverables),
      constraints: job.constraints || null,
      riskFactors: this.transformArray(job.riskFactors),
      visibility: job.visibility || 'PUBLIC',
      createdAt: job.createdAt || null,
      updatedAt: job.updatedAt || null,
      client: this.transformClient(job.client),
      budget: this.transformBudget(job.budget),
      requiredSkills: this.transformSkills(job.requiredSkills),
      preferredSkills: this.transformSkills(job.preferredSkills),
    };
  }

  /**
   * Transform a single job entity
   */
  transform(job: any) {
    return this.transformBase(job);
  }

  /**
   * Transform an array of job entities
   */
  transformMany(jobs: any[]) {
    if (!Array.isArray(jobs)) return [];
    
    return jobs
      .filter(job => job !== null && job !== undefined)
      .map(job => this.transformBase(job))
      .filter(transformedJob => transformedJob !== null);
  }

  /**
   * Transform job for creation response (exclude sensitive fields)
   */
  transformForCreate(job: any) {
    const base = this.transformBase(job);
    if (!base) return null;

    // Only return essential fields for creation
    return {
      id: base.id,
      title: base.title,
      description: base.description,
      deadline: base.deadline,
      status: base.status,
      priority: base.priority,
      projectType: base.projectType,
      location: base.location,
      estimatedHours: base.estimatedHours,
      tags: base.tags,
      visibility: base.visibility,
      createdAt: base.createdAt,
      client: base.client,
    };
  }

  /**
   * Transform job for update response
   */
  transformForUpdate(job: any) {
    const base = this.transformBase(job);
    if (!base) return null;

    // Focus on fields that are typically updated
    return {
      id: base.id,
      title: base.title,
      description: base.description,
      deadline: base.deadline,
      status: base.status,
      priority: base.priority,
      projectType: base.projectType,
      location: base.location,
      estimatedHours: base.estimatedHours,
      tags: base.tags,
      requirements: base.requirements,
      deliverables: base.deliverables,
      constraints: base.constraints,
      riskFactors: base.riskFactors,
      visibility: base.visibility,
      updatedAt: base.updatedAt,
      client: base.client,
    };
  }
}
