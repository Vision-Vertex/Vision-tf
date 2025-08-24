import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateBudgetDto } from '../dto/create-budget.dto';

@Injectable()
export class BudgetValidator {
  // Supported currencies (ISO 4217 codes)
  private readonly supportedCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL',
    'MXN', 'KRW', 'SGD', 'HKD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF'
  ];

  // Supported budget types
  private readonly supportedBudgetTypes = ['FIXED', 'HOURLY', 'MILESTONE', 'HYBRID'];

  /**
   * Validates budget creation data
   */
  async validateBudgetCreation(budgetData: CreateBudgetDto): Promise<void> {
    // Validate budget type
    this.validateBudgetType(budgetData.type);

    // Validate amount
    this.validateBudgetAmount(budgetData.amount);

    // Validate currency
    this.validateCurrency(budgetData.currency);

    // Validate estimated hours for hourly projects
    if (budgetData.type === 'HOURLY' && budgetData.estimatedHours) {
      this.validateEstimatedHours(budgetData.estimatedHours);
    }

    // Validate business rules (which includes milestone validation if needed)
    this.validateBusinessRules(budgetData);
  }

  /**
   * Validates budget amount for updates
   */
  async validateBudgetAmountForUpdate(amount: number, currency: string): Promise<void> {
    this.validateBudgetAmount(amount);
    this.validateCurrency(currency);
  }

  /**
   * Validates budget type
   */
  private validateBudgetType(type: string): void {
    if (!this.supportedBudgetTypes.includes(type)) {
      throw new BadRequestException(`Unsupported budget type: ${type}. Supported types: ${this.supportedBudgetTypes.join(', ')}`);
    }
  }

  /**
   * Validates budget amount
   */
  private validateBudgetAmount(amount: number): void {
    if (amount <= 0) {
      throw new BadRequestException('Budget amount must be greater than 0');
    }

    if (amount > 1000000) {
      throw new BadRequestException('Budget amount cannot exceed 1,000,000');
    }
  }

  /**
   * Validates currency
   */
  private validateCurrency(currency: string): void {
    if (!this.supportedCurrencies.includes(currency)) {
      throw new BadRequestException(`Unsupported currency: ${currency}. Supported currencies: ${this.supportedCurrencies.join(', ')}`);
    }
  }

  /**
   * Validates estimated hours
   */
  private validateEstimatedHours(hours: number): void {
    if (hours <= 0) {
      throw new BadRequestException('Estimated hours must be greater than 0');
    }

    if (hours > 10000) {
      throw new BadRequestException('Estimated hours cannot exceed 10,000');
    }
  }

  /**
   * Validates milestones (optional)
   */
  private validateMilestones(milestones: any[], totalAmount: number): void {
    // If no milestones provided, that's perfectly fine
    if (!milestones || milestones.length === 0) {
      return;
    }

    let totalPercentage = 0;
    let totalMilestoneAmount = 0;

    for (const milestone of milestones) {
      // Validate milestone name (optional but recommended)
      if (!milestone.name || milestone.name.trim().length === 0) {
        milestone.name = `Milestone ${milestones.indexOf(milestone) + 1}`; // Auto-generate name if missing
      }

      if (milestone.name.length > 100) {
        milestone.name = milestone.name.substring(0, 97) + '...'; // Truncate if too long
      }

      // Validate milestone amount (optional but recommended)
      if (!milestone.amount || milestone.amount <= 0) {
        milestone.amount = 0; // Set to 0 if missing or invalid
        console.warn(`Warning: Milestone amount for '${milestone.name}' was missing or invalid, setting to 0`);
      }

      // Allow milestone amounts to exceed budget - they can be estimates or include additional costs
      if (milestone.amount > totalAmount * 1.5) {
        console.warn(`Warning: Milestone amount for '${milestone.name}' (${milestone.amount}) is significantly higher than budget (${totalAmount}). This may indicate a planning issue.`);
      }

      // Validate milestone percentage (optional, but if provided, must be valid)
      if (milestone.percentage !== undefined) {
        if (milestone.percentage < 0 || milestone.percentage > 100) {
          throw new BadRequestException(`Milestone percentage for '${milestone.name}' must be between 0 and 100`);
        }
        totalPercentage += milestone.percentage;
      }

      totalMilestoneAmount += milestone.amount;
    }

    // Percentage validation is completely optional - no strict 100% requirement
    // Only validate if user explicitly wants to enforce percentages
    const allMilestonesHavePercentages = milestones.every(m => m.percentage !== undefined);
    
    if (allMilestonesHavePercentages && totalPercentage > 0) {
      // If all milestones have percentages, they should add up to 100% (but this is just a warning, not enforced)
      if (Math.abs(totalPercentage - 100) > 0.01) {
        console.warn(`Warning: Total milestone percentage is ${totalPercentage}%, not 100%. This is allowed but may cause tracking issues.`);
      }
    }

    // Amount validation is also flexible - milestones can be partial amounts
    // Only warn if there's a significant mismatch, but don't block creation
    if (Math.abs(totalMilestoneAmount - totalAmount) > 0.01) {
      if (totalMilestoneAmount > totalAmount) {
        console.warn(`Warning: Total milestone amount (${totalMilestoneAmount}) exceeds budget (${totalAmount}). This may cause tracking issues.`);
      } else {
        console.warn(`Warning: Total milestone amount (${totalMilestoneAmount}) is less than budget (${totalAmount}). Remaining amount: ${totalAmount - totalMilestoneAmount}`);
      }
    }
  }

  /**
   * Validates business rules
   */
  private validateBusinessRules(budgetData: CreateBudgetDto): void {
    // Rule: Hourly projects should have estimated hours
    if (budgetData.type === 'HOURLY' && !budgetData.estimatedHours) {
      throw new BadRequestException('Estimated hours are required for hourly projects');
    }

    // Rule: Milestone projects can optionally have milestones
    if (budgetData.type === 'MILESTONE' && budgetData.milestones && budgetData.milestones.length > 0) {
      // Validate that milestones are properly structured if provided
      this.validateMilestones(budgetData.milestones, budgetData.amount);
    }

    // Rule: Fixed projects can optionally have milestones for planning purposes
    if (budgetData.type === 'FIXED' && budgetData.milestones && budgetData.milestones.length > 0) {
      // Validate that milestones are properly structured if provided
      this.validateMilestones(budgetData.milestones, budgetData.amount);
    }

    // Rule: Notes length limit
    if (budgetData.notes && budgetData.notes.length > 500) {
      throw new BadRequestException('Budget notes cannot exceed 500 characters');
    }
  }

  /**
   * Formats budget amount with currency
   */
  formatBudgetAmount(amount: number, currency: string): string {
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return formatter.format(amount);
    } catch (error) {
      // Fallback formatting
      return `${currency} ${amount.toFixed(2)}`;
    }
  }
}
