import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/card';
import Button from '../../../components/ui/button/Button';
import {
  Shield,
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  Filter,
  Download,
  Search,
  Calendar,
  Eye,
  FileText,
  Database
} from 'lucide-react';
import { auditTrail, AuditLogEntry, AuditAction, EntityType, AuditCategory } from '../../../utils/auditTrail';

const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    action: '' as AuditAction | '',
    entityType: '' as EntityType | '',
    severity: '',
    category: '' as AuditCategory | '',
    searchTerm: ''
  });

  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadAuditLogs();
    loadStatistics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const loadAuditLogs = () => {
    setLoading(true);
    try {
      // Load persisted logs
      auditTrail.loadPersistedLogs();
      
      // Get all logs
      const allLogs = auditTrail.getLogs({ limit: 1000 });
      setLogs(allLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = () => {
    const stats = auditTrail.getStatistics('month');
    setStatistics(stats);
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (filters.startDate) {
      filtered = filtered.filter(log => 
        log.timestamp >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(log => 
        log.timestamp <= new Date(filters.endDate)
      );
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.entityType) {
      filtered = filtered.filter(log => log.entity_type === filters.entityType);
    }

    if (filters.severity) {
      filtered = filtered.filter(log => log.severity === filters.severity);
    }

    if (filters.category) {
      filtered = filtered.filter(log => log.category === filters.category);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.description.toLowerCase().includes(term) ||
        log.user_name.toLowerCase().includes(term) ||
        (log.entity_name && log.entity_name.toLowerCase().includes(term))
      );
    }

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userId: '',
      action: '' as AuditAction | '',
      entityType: '' as EntityType | '',
      severity: '',
      category: '' as AuditCategory | '',
      searchTerm: ''
    });
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity Name', 'Description', 'Severity', 'Category'],
      ...filteredLogs.map(log => [
        log.timestamp.toISOString(),
        log.user_name,
        log.action,
        log.entity_type,
        log.entity_name || '',
        log.description,
        log.severity,
        log.category
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return <FileText className="w-4 h-4 text-green-600" />;
      case 'UPDATE':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'DELETE':
        return <FileText className="w-4 h-4 text-red-600" />;
      case 'VIEW':
        return <Eye className="w-4 h-4 text-gray-600" />;
      case 'EXPORT':
        return <Download className="w-4 h-4 text-purple-600" />;
      case 'IMPORT':
        return <Database className="w-4 h-4 text-indigo-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit trail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={exportLogs}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalEvents}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Critical Events</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.criticalEvents}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <User className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(statistics.byUser).length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(statistics.byAction.CREATE || 0) + (statistics.byAction.UPDATE || 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </h3>
          <Button onClick={clearFilters} variant="outline" size="sm">
            Clear All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="VIEW">View</option>
              <option value="EXPORT">Export</option>
              <option value="IMPORT">Import</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <select
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="ACCOUNT">Account</option>
              <option value="VOUCHER">Voucher</option>
              <option value="JOURNAL_ENTRY">Journal Entry</option>
              <option value="USER">User</option>
              <option value="REPORT">Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredLogs.length} of {logs.length} audit entries
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{log.timestamp.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{log.user_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      {getActionIcon(log.action)}
                      <span>{log.action}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{log.entity_type}</div>
                      {log.entity_name && (
                        <div className="text-gray-500 text-xs">{log.entity_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                    {log.description}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(log.severity)}`}>
                      {getSeverityIcon(log.severity)}
                      <span>{log.severity.toUpperCase()}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Button
                      onClick={() => {
                        setSelectedLog(log);
                        setShowDetails(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No audit entries found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </Card>

      {/* Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
              <Button
                onClick={() => setShowDetails(false)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="text-sm text-gray-900">{selectedLog.timestamp.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">{selectedLog.user_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action</label>
                  <p className="text-sm text-gray-900">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                  <p className="text-sm text-gray-900">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Severity</label>
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(selectedLog.severity)}`}>
                    {getSeverityIcon(selectedLog.severity)}
                    <span>{selectedLog.severity.toUpperCase()}</span>
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-sm text-gray-900">{selectedLog.category}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900">{selectedLog.description}</p>
              </div>

              {selectedLog.changes && selectedLog.changes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Changes</label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Field</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Old Value</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">New Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedLog.changes.map((change, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 font-medium">{change.field_label}</td>
                            <td className="px-3 py-2 text-red-600">{String(change.old_value)}</td>
                            <td className="px-3 py-2 text-green-600">{String(change.new_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedLog.ip_address && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block font-medium text-gray-700">IP Address</label>
                    <p className="text-gray-900">{selectedLog.ip_address}</p>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700">Session ID</label>
                    <p className="text-gray-900">{selectedLog.session_id}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;