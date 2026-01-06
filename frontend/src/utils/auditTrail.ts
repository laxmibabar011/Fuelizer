/**
 * Audit Trail System for tracking all changes and user actions
 */

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  user_id: number;
  user_name: string;
  action: AuditAction;
  entity_type: EntityType;
  entity_id: string | number;
  entity_name?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changes?: FieldChange[];
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: AuditCategory;
}

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'VIEW' 
  | 'EXPORT' 
  | 'IMPORT' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'CANCEL'
  | 'RESTORE';

export type EntityType = 
  | 'ACCOUNT' 
  | 'VOUCHER' 
  | 'JOURNAL_ENTRY' 
  | 'USER' 
  | 'REPORT' 
  | 'SETTINGS'
  | 'TEMPLATE';

export type AuditCategory = 
  | 'AUTHENTICATION'
  | 'FINANCIAL_TRANSACTION'
  | 'ACCOUNT_MANAGEMENT'
  | 'DATA_EXPORT'
  | 'DATA_IMPORT'
  | 'SYSTEM_CONFIGURATION'
  | 'REPORTING'
  | 'USER_MANAGEMENT';

export interface FieldChange {
  field_name: string;
  field_label: string;
  old_value: any;
  new_value: any;
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'object';
}

/**
 * Audit Trail Service
 */
export class AuditTrailService {
  private static instance: AuditTrailService;
  private logs: AuditLogEntry[] = [];
  private currentUser: { id: number; name: string } | null = null;

  static getInstance(): AuditTrailService {
    if (!AuditTrailService.instance) {
      AuditTrailService.instance = new AuditTrailService();
    }
    return AuditTrailService.instance;
  }

  setCurrentUser(user: { id: number; name: string }) {
    this.currentUser = user;
  }

  /**
   * Log an audit event
   */
  async logEvent(params: {
    action: AuditAction;
    entity_type: EntityType;
    entity_id: string | number;
    entity_name?: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    description?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: AuditCategory;
  }): Promise<void> {
    if (!this.currentUser) {
      console.warn('Audit log attempted without current user set');
      return;
    }

    const logEntry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      user_id: this.currentUser.id,
      user_name: this.currentUser.name,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      entity_name: params.entity_name,
      old_values: params.old_values,
      new_values: params.new_values,
      changes: this.calculateChanges(params.old_values, params.new_values),
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent,
      session_id: this.getSessionId(),
      description: params.description || this.generateDescription(params),
      severity: params.severity || this.determineSeverity(params.action, params.entity_type),
      category: params.category || this.determineCategory(params.entity_type, params.action)
    };

    // Store locally (in production, this would be sent to backend)
    this.logs.push(logEntry);
    
    // Store in localStorage for persistence
    this.persistLogs();

    // Send to backend (if available)
    try {
      await this.sendToBackend(logEntry);
    } catch (error) {
      console.warn('Failed to send audit log to backend:', error);
    }
  }

  /**
   * Calculate field changes between old and new values
   */
  private calculateChanges(oldValues?: Record<string, any>, newValues?: Record<string, any>): FieldChange[] {
    if (!oldValues || !newValues) return [];

    const changes: FieldChange[] = [];
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    allKeys.forEach(key => {
      const oldValue = oldValues[key];
      const newValue = newValues[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field_name: key,
          field_label: this.formatFieldLabel(key),
          old_value: oldValue,
          new_value: newValue,
          data_type: this.getDataType(newValue || oldValue)
        });
      }
    });

    return changes;
  }

  /**
   * Generate human-readable description
   */
  private generateDescription(params: {
    action: AuditAction;
    entity_type: EntityType;
    entity_id: string | number;
    entity_name?: string;
  }): string {
    const entityName = params.entity_name || `${params.entity_type.toLowerCase()} #${params.entity_id}`;
    
    switch (params.action) {
      case 'CREATE':
        return `Created ${params.entity_type.toLowerCase()}: ${entityName}`;
      case 'UPDATE':
        return `Updated ${params.entity_type.toLowerCase()}: ${entityName}`;
      case 'DELETE':
        return `Deleted ${params.entity_type.toLowerCase()}: ${entityName}`;
      case 'VIEW':
        return `Viewed ${params.entity_type.toLowerCase()}: ${entityName}`;
      case 'EXPORT':
        return `Exported ${params.entity_type.toLowerCase()} data`;
      case 'IMPORT':
        return `Imported ${params.entity_type.toLowerCase()} data`;
      case 'APPROVE':
        return `Approved ${params.entity_type.toLowerCase()}: ${entityName}`;
      case 'REJECT':
        return `Rejected ${params.entity_type.toLowerCase()}: ${entityName}`;
      case 'CANCEL':
        return `Cancelled ${params.entity_type.toLowerCase()}: ${entityName}`;
      default:
        return `${params.action} ${params.entity_type.toLowerCase()}: ${entityName}`;
    }
  }

  /**
   * Determine severity based on action and entity type
   */
  private determineSeverity(action: AuditAction, entityType: EntityType): 'low' | 'medium' | 'high' | 'critical' {
    // Critical actions
    if (action === 'DELETE' && ['VOUCHER', 'ACCOUNT'].includes(entityType)) {
      return 'critical';
    }
    
    // High severity
    if (['DELETE', 'IMPORT', 'EXPORT'].includes(action)) {
      return 'high';
    }
    
    // Medium severity
    if (['CREATE', 'UPDATE', 'APPROVE', 'REJECT'].includes(action)) {
      return 'medium';
    }
    
    // Low severity
    return 'low';
  }

  /**
   * Determine category based on entity type and action
   */
  private determineCategory(entityType: EntityType, action: AuditAction): AuditCategory {
    switch (entityType) {
      case 'VOUCHER':
      case 'JOURNAL_ENTRY':
        return 'FINANCIAL_TRANSACTION';
      case 'ACCOUNT':
        return 'ACCOUNT_MANAGEMENT';
      case 'USER':
        return action === 'LOGIN' || action === 'LOGOUT' ? 'AUTHENTICATION' : 'USER_MANAGEMENT';
      case 'REPORT':
        return 'REPORTING';
      case 'SETTINGS':
        return 'SYSTEM_CONFIGURATION';
      default:
        if (action === 'EXPORT') return 'DATA_EXPORT';
        if (action === 'IMPORT') return 'DATA_IMPORT';
        return 'SYSTEM_CONFIGURATION';
    }
  }

  /**
   * Get audit logs with filtering
   */
  getLogs(filters?: {
    startDate?: Date;
    endDate?: Date;
    userId?: number;
    action?: AuditAction;
    entityType?: EntityType;
    severity?: string;
    category?: AuditCategory;
    limit?: number;
  }): AuditLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
      }
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.user_id === filters.userId);
      }
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }
      if (filters.entityType) {
        filteredLogs = filteredLogs.filter(log => log.entity_type === filters.entityType);
      }
      if (filters.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
      }
      if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category);
      }
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  }

  /**
   * Get audit statistics
   */
  getStatistics(timeframe: 'today' | 'week' | 'month' | 'year' = 'today') {
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const logs = this.getLogs({ startDate });

    return {
      totalEvents: logs.length,
      byAction: this.groupBy(logs, 'action'),
      byEntityType: this.groupBy(logs, 'entity_type'),
      bySeverity: this.groupBy(logs, 'severity'),
      byCategory: this.groupBy(logs, 'category'),
      byUser: this.groupBy(logs, 'user_name'),
      criticalEvents: logs.filter(log => log.severity === 'critical').length,
      recentActivity: logs.slice(0, 10)
    };
  }

  // Helper methods
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  private getSessionId(): string {
    return sessionStorage.getItem('sessionId') || 'unknown';
  }

  private formatFieldLabel(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private getDataType(value: any): 'string' | 'number' | 'boolean' | 'date' | 'object' {
    if (value === null || value === undefined) return 'string';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (value instanceof Date) return 'date';
    if (typeof value === 'object') return 'object';
    return 'string';
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private persistLogs(): void {
    try {
      const recentLogs = this.logs.slice(-1000); // Keep only last 1000 logs
      localStorage.setItem('auditLogs', JSON.stringify(recentLogs));
    } catch (error) {
      console.warn('Failed to persist audit logs:', error);
    }
  }

  private async sendToBackend(logEntry: AuditLogEntry): Promise<void> {
    // In production, send to backend API
    // await fetch('/api/audit-logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logEntry)
    // });
  }

  /**
   * Load persisted logs on initialization
   */
  loadPersistedLogs(): void {
    try {
      const stored = localStorage.getItem('auditLogs');
      if (stored) {
        const logs = JSON.parse(stored);
        this.logs = logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load persisted audit logs:', error);
    }
  }
}

// Export singleton instance
export const auditTrail = AuditTrailService.getInstance();

// Convenience functions for common audit events
export const auditHelpers = {
  logAccountCreated: (accountId: number, accountName: string, accountData: any) => {
    auditTrail.logEvent({
      action: 'CREATE',
      entity_type: 'ACCOUNT',
      entity_id: accountId,
      entity_name: accountName,
      new_values: accountData,
      description: `Created new account: ${accountName}`,
      severity: 'medium'
    });
  },

  logVoucherCreated: (voucherId: number, voucherNumber: string, voucherData: any) => {
    auditTrail.logEvent({
      action: 'CREATE',
      entity_type: 'VOUCHER',
      entity_id: voucherId,
      entity_name: voucherNumber,
      new_values: voucherData,
      description: `Created new voucher: ${voucherNumber}`,
      severity: 'medium'
    });
  },

  logDataExport: (entityType: EntityType, recordCount: number) => {
    auditTrail.logEvent({
      action: 'EXPORT',
      entity_type: entityType,
      entity_id: 'bulk',
      description: `Exported ${recordCount} ${entityType.toLowerCase()} records`,
      severity: 'high'
    });
  },

  logDataImport: (entityType: EntityType, recordCount: number) => {
    auditTrail.logEvent({
      action: 'IMPORT',
      entity_type: entityType,
      entity_id: 'bulk',
      description: `Imported ${recordCount} ${entityType.toLowerCase()} records`,
      severity: 'high'
    });
  },

  logLogin: (userId: number, userName: string) => {
    auditTrail.logEvent({
      action: 'LOGIN',
      entity_type: 'USER',
      entity_id: userId,
      entity_name: userName,
      description: `User logged in: ${userName}`,
      severity: 'low',
      category: 'AUTHENTICATION'
    });
  },

  logLogout: (userId: number, userName: string) => {
    auditTrail.logEvent({
      action: 'LOGOUT',
      entity_type: 'USER',
      entity_id: userId,
      entity_name: userName,
      description: `User logged out: ${userName}`,
      severity: 'low',
      category: 'AUTHENTICATION'
    });
  }
};