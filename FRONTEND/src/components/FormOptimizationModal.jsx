import React, { useState, useEffect } from 'react';
import Icon from './AppIcon';
import Button from './ui/Button';

export default function FormOptimizationModal({
  isOpen,
  isLoading,
  optimizationData,
  onApply,
  onDiscard,
  onClose
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);

  const steps = [
    'Evaluating question clarity & ambiguity...',
    'Analyzing cognitive load & form length...',
    'Checking logical question flow...',
    'Validating target audience suitability...',
    'Calculating completion probability score...'
  ];

  // Simulated loading steps when loading
  useEffect(() => {
    if (!isLoading) {
      setAnalysisStep(steps.length - 1);
      return;
    }
    setAnalysisStep(0);
    const interval = setInterval(() => {
      setAnalysisStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Score count up animation when loading finishes
  useEffect(() => {
    if (isLoading || !optimizationData) {
      setAnimatedScore(0);
      return;
    }

    const targetScore = optimizationData?.overall_score ?? optimizationData?.score ?? 85;
    let current = 0;
    const duration = 1200; // ms
    const stepTime = 20;
    const stepsCount = duration / stepTime;
    const increment = targetScore / stepsCount;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetScore) {
        setAnimatedScore(targetScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isLoading, optimizationData]);

  if (!isOpen) return null;

  const score = optimizationData?.overall_score ?? optimizationData?.score ?? 85;
  const issues = optimizationData?.issues || [];
  const summary = optimizationData?.summary || '';
  const diff = optimizationData?.diff || { added: [], modified: [], removed: [] };

  // Color helper based on score
  const getScoreColor = (val) => {
    if (val >= 80) return { text: 'text-emerald-400', stroke: '#10B981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (val >= 60) return { text: 'text-amber-400', stroke: '#F59E0B', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { text: 'text-rose-400', stroke: '#EF4444', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  };

  const scoreColor = getScoreColor(score);

  // SVG Circular Progress Math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getSeverityBadge = (severity) => {
    const s = String(severity || '').toLowerCase();
    if (s === 'high') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
          🔴 High
        </span>
      );
    }
    if (s === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
          🟡 Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        🟢 Low
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#1E293B]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Icon name="Sparkles" size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                AI Form Optimization Engine
              </h3>
              <p className="text-xs text-gray-400">
                Automated UX & completion rate analysis powered by Gemini AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose || onDiscard}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {isLoading ? (
            /* Loading State */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <Icon name="Sparkles" size={32} className="absolute text-indigo-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1">
                  Analyzing your form...
                </h4>
                <p className="text-xs text-indigo-300 transition-all duration-300">
                  {steps[analysisStep]}
                </p>
              </div>
              <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse" style={{ width: `${((analysisStep + 1) / steps.length) * 100}%` }} />
              </div>
            </div>
          ) : (
            /* Optimization Dashboard */
            <>
              {/* Score & Overview Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score Circle Card */}
                <div className={`p-4 rounded-xl border ${scoreColor.border} ${scoreColor.bg} flex flex-col items-center justify-center text-center`}>
                  <span className="text-xs font-semibold text-gray-400 mb-2">Form Quality Score</span>
                  
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-slate-800"
                        fill="transparent"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        stroke={scoreColor.stroke}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-2xl font-extrabold ${scoreColor.text}`}>
                        {animatedScore}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">out of 100</span>
                    </div>
                  </div>

                  <span className={`mt-2 text-xs font-bold ${scoreColor.text}`}>
                    {score >= 80 ? '🌟 Excellent UX' : score >= 60 ? '⚡ Good - Can Improve' : '⚠️ Needs Optimization'}
                  </span>
                </div>

                {/* AI Summary Box */}
                <div className="md:col-span-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1.5">
                      <Icon name="Zap" size={14} /> AI Optimization Summary
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {summary || 'Your form was analyzed for clarity, cognitive load, flow, and target audience fit. Applying these optimizations will reduce user drop-off and improve completion rates.'}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Target Audience: <strong className="text-gray-200">{optimizationData?.targetAudience || 'General'}</strong></span>
                    <span>Language: <strong className="text-gray-200">{optimizationData?.language || 'English'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Detected UX Issues */}
              {issues.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Icon name="AlertTriangle" size={15} color="#F59E0B" />
                    Identified UX Issues ({issues.length})
                  </h4>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {issues.map((issue, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getSeverityBadge(issue.severity)}
                            <span className="font-semibold text-gray-200 capitalize">
                              {issue.type ? issue.type.replace('_', ' ') : 'UX Issue'}
                            </span>
                            {issue.question_index >= 0 && (
                              <span className="text-[10px] text-gray-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                Question #{issue.question_index + 1}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-300 text-[11px]">
                          {issue.description}
                        </p>
                        {issue.suggestion && (
                          <p className="text-indigo-300/90 text-[11px] flex items-start gap-1 bg-indigo-950/30 p-1.5 rounded border border-indigo-500/20">
                            <span className="flex-shrink-0">💡</span>
                            <span><strong>Fix:</strong> {issue.suggestion}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Changes Preview (Diff) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Icon name="FileDiff" size={15} color="#818CF8" />
                    Proposed Optimization Changes
                  </h4>
                  <span className="text-[11px] text-gray-400">Comparing original vs optimized form</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {diff?.added?.map((item, idx) => (
                    <div key={`add-${idx}`} className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-500/20 p-2.5 rounded-lg">
                      <span className="flex-shrink-0">✅</span>
                      <div>
                        <span className="font-semibold">Added:</span> "{item.title || 'Untitled'}"
                        <span className="text-emerald-400/70 ml-1.5">({item.type ? item.type.replace('_', ' ') : item.kind})</span>
                      </div>
                    </div>
                  ))}

                  {diff?.modified?.map((mod, idx) => (
                    <div key={`mod-${idx}`} className="flex items-start gap-2 text-xs text-amber-300 bg-amber-950/30 border border-amber-500/20 p-2.5 rounded-lg">
                      <span className="flex-shrink-0">✏️</span>
                      <div>
                        <span className="font-semibold">Modified:</span> "{mod.title || mod.originalTitle}"
                        <span className="text-amber-400/80 ml-1">→ {mod.changes}</span>
                      </div>
                    </div>
                  ))}

                  {diff?.removed?.map((item, idx) => (
                    <div key={`rem-${idx}`} className="flex items-start gap-2 text-xs text-rose-300 bg-rose-950/30 border border-rose-500/20 p-2.5 rounded-lg">
                      <span className="flex-shrink-0">❌</span>
                      <div>
                        <span className="font-semibold">Removed:</span> "{item.title || 'Untitled'}"
                      </div>
                    </div>
                  ))}

                  {(!diff?.added?.length && !diff?.modified?.length && !diff?.removed?.length) && (
                    <div className="text-xs text-gray-400 italic py-2 text-center bg-slate-900/30 rounded-lg">
                      Questions refactored and streamlined for maximum clarity.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isLoading && (
          <div className="px-6 py-4 border-t border-[#1E293B] bg-[#1E293B]/40 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onDiscard}
              className="text-gray-300 border-slate-700 hover:bg-slate-800 text-xs font-semibold"
            >
              Keep Original
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => onApply(optimizationData?.optimized_items || [])}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <Icon name="Check" size={15} />
              Use Optimized Version
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
