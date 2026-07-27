import React, { useState, useEffect } from 'react';
import { ShieldAlert, Flame, Filter, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { analyticsService } from '../../services/analytics.service';

export interface AnomalyAlert {
  id: string;
  classCode: string;
  subjectCode: string;
  assessmentSlot: string;
  aiDependencyRate: number;
  departmentBaselineAvg: number;
  spikePercentage: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  recommendation: string;
}

export interface HeatmapCell {
  aiDependencyRate: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  submissionCount: number;
}

export interface HeatmapRow {
  classId: string;
  classCode: string;
  subjectCode: string;
  slots: Record<string, HeatmapCell>;
}

export const AiIntegrityHeatmap: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [filterTier, setFilterTier] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');
  const [activeCell, setActiveCell] = useState<{ classCode: string; slot: string; cell: HeatmapCell } | null>(null);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const data = await analyticsService.getIntegrityHeatmap();
        setHeatmapData(data);
      } catch (err) {
        console.error('Failed to load integrity heatmap data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4318FF]"></div>
          <p className="text-xs font-bold text-gray-400">Loading AI Integrity Matrix...</p>
        </div>
      </div>
    );
  }

  const assessmentSlots: string[] = heatmapData?.assessmentSlots || [
    'Progress Test 1',
    'Practical Exam 1',
    'Assignment 1',
    'Final Project'
  ];

  const heatmapMatrix: HeatmapRow[] = heatmapData?.heatmapMatrix || [];
  const anomalyAlerts: AnomalyAlert[] = heatmapData?.anomalyAlerts || [];
  const departmentBaselineAvg = heatmapData?.departmentBaselineAvg || 22.4;

  // Filter matrix rows
  const filteredMatrix = heatmapMatrix.filter(row => {
    if (selectedSubject !== 'ALL' && row.subjectCode !== selectedSubject) return false;
    if (filterTier === 'CRITICAL') {
      return Object.values(row.slots).some(s => s.aiDependencyRate >= 60);
    }
    if (filterTier === 'HIGH') {
      return Object.values(row.slots).some(s => s.aiDependencyRate >= 45);
    }
    return true;
  });

  const getCellBadgeClass = (rate: number) => {
    if (rate >= 60) {
      return 'bg-red-500 text-white font-extrabold shadow-md shadow-red-500/30 animate-pulse border border-red-400';
    }
    if (rate >= 45) {
      return 'bg-orange-500 text-white font-bold border border-orange-400';
    }
    if (rate >= 25) {
      return 'bg-yellow-400 text-gray-900 font-bold border border-yellow-300';
    }
    return 'bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200';
  };

  const getSubjectList = () => {
    const list = Array.from(new Set(heatmapMatrix.map(r => r.subjectCode)));
    return ['ALL', ...list];
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-[#1B2559]">AI Integrity Radar & Heatmap</h2>
            <span className="bg-red-100 text-red-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Live Monitor
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Department-wide AI similarity density matrix across assessment slots. Department Baseline: <strong className="text-[#1B2559]">{departmentBaselineAvg}%</strong>
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400 mr-2" />
            <span className="text-xs font-bold text-gray-500 mr-2">Subject:</span>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#1B2559] outline-none cursor-pointer"
            >
              {getSubjectList().map(subj => (
                <option key={subj} value={subj}>
                  {subj === 'ALL' ? 'All Subjects' : subj}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 text-xs font-bold">
            <button
              onClick={() => setFilterTier('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${filterTier === 'ALL' ? 'bg-white text-[#1B2559] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterTier('HIGH')}
              className={`px-3 py-1 rounded-lg transition-all ${filterTier === 'HIGH' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              High &gt;45%
            </button>
            <button
              onClick={() => setFilterTier('CRITICAL')}
              className={`px-3 py-1 rounded-lg transition-all ${filterTier === 'CRITICAL' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Spikes &gt;60%
            </button>
          </div>
        </div>
      </div>

      {/* Anomaly Alerts Section */}
      {anomalyAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-600 animate-bounce" />
              <h3 className="text-sm font-extrabold text-red-950 uppercase tracking-wide">
                Anomaly Detection Alerts ({anomalyAlerts.length} Active Spikes)
              </h3>
            </div>
            <Link
              to={ROUTES.SUSPICIOUS_CASES}
              className="text-xs font-bold text-red-700 hover:text-red-900 underline flex items-center"
            >
              Audit Flagged Cases <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {anomalyAlerts.map(alert => (
              <div
                key={alert.id}
                className="bg-white/90 backdrop-blur-sm rounded-xl p-3.5 border border-red-100 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-[#1B2559]">{alert.classCode}</span>
                    <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                      +{alert.spikePercentage}% vs Baseline
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-red-600">
                    {alert.assessmentSlot} — {alert.aiDependencyRate}% AI Similarity
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 font-medium line-clamp-2">
                    {alert.recommendation}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                  <Link
                    to={ROUTES.SUSPICIOUS_CASES}
                    className="text-[11px] font-bold text-[#4318FF] hover:underline flex items-center"
                  >
                    Inspect Class Audit <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap Grid Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                Class / Subject
              </th>
              {assessmentSlots.map(slot => (
                <th key={slot} className="text-center py-3 px-4 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  {slot}
                </th>
              ))}
              <th className="text-center py-3 px-4 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                Class Avg
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredMatrix.map(row => {
              const rates = Object.values(row.slots).map(s => s.aiDependencyRate);
              const rowAvg = (rates.reduce((a, b) => a + b, 0) / (rates.length || 1)).toFixed(1);

              return (
                <tr key={row.classId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-extrabold text-sm text-[#1B2559]">{row.classCode}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">{row.subjectCode}</div>
                  </td>

                  {assessmentSlots.map(slot => {
                    const cell = row.slots[slot] || { aiDependencyRate: 0, riskLevel: 'low', submissionCount: 0 };
                    return (
                      <td key={slot} className="py-4 px-4 text-center">
                        <button
                          onClick={() => setActiveCell({ classCode: row.classCode, slot, cell })}
                          className={`px-3 py-1.5 rounded-xl text-xs transition-transform hover:scale-105 ${getCellBadgeClass(cell.aiDependencyRate)}`}
                        >
                          {cell.aiDependencyRate}%
                        </button>
                      </td>
                    );
                  })}

                  <td className="py-4 px-4 text-center font-extrabold text-xs text-[#1B2559]">
                    {rowAvg}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend & Baseline Bar */}
      <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-100 gap-4 text-xs">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-gray-400 uppercase text-[10px]">Risk Tier Legend:</span>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
            <span className="font-semibold text-gray-600">&lt;25% Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
            <span className="font-semibold text-gray-600">25-45% Moderate</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
            <span className="font-semibold text-gray-600">45-60% High</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block animate-ping"></span>
            <span className="font-extrabold text-red-600">&gt;60% Critical Spike</span>
          </div>
        </div>

        <Link
          to={ROUTES.SUSPICIOUS_CASES}
          className="text-xs font-extrabold text-[#4318FF] hover:underline flex items-center"
        >
          View All Suspicious Submissions <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

      {/* Cell Detail Modal Drawer */}
      {activeCell && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-base font-extrabold text-[#1B2559]">{activeCell.classCode}</h4>
                <p className="text-xs text-gray-400 font-bold">{activeCell.slot}</p>
              </div>
              <button
                onClick={() => setActiveCell(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-gray-500">AI Similarity Rate</span>
                <span className={`text-base font-black px-3 py-1 rounded-xl ${getCellBadgeClass(activeCell.cell.aiDependencyRate)}`}>
                  {activeCell.cell.aiDependencyRate}%
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-gray-500">Total Submissions Evaluated</span>
                <span className="text-sm font-extrabold text-[#1B2559]">{activeCell.cell.submissionCount} Submissions</span>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-gray-500">Risk Assessment</span>
                <span className="text-xs font-extrabold uppercase text-[#4318FF]">{activeCell.cell.riskLevel}</span>
              </div>
            </div>

            <div className="pt-2 flex space-x-3">
              <button
                onClick={() => setActiveCell(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <Link
                to={ROUTES.SUSPICIOUS_CASES}
                className="flex-1 py-2.5 bg-[#4318FF] hover:bg-[#3311CC] text-white font-bold text-xs rounded-xl text-center shadow-lg shadow-blue-500/20"
              >
                Audit Submissions
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
