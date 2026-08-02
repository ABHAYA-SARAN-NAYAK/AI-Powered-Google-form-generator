import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FormCard = ({ form, isSelected, onSelect, onEdit, onCopy, onView, onAnalytics, onRegenerate, onDelete, busy = false }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'Draft':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'Archived':
        return 'bg-slate-800 text-gray-400 border border-slate-700';
      default:
        return 'bg-slate-800 text-gray-400 border border-slate-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Survey':
        return 'ClipboardList';
      case 'Quiz':
        return 'GraduationCap';
      case 'Feedback':
        return 'MessageSquare';
      case 'Registration':
        return 'UserPlus';
      default:
        return 'FileText';
    }
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-[#1F2937] overflow-hidden shadow-xl hover:border-indigo-500/30 transition-smooth">
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(form?.id, e?.target?.checked)}
            className="w-4 h-4 rounded border-[#1F2937] bg-[#0A0F1E] text-indigo-500 focus:ring-2 focus:ring-primary focus:ring-offset-[#0A0F1E] accent-indigo-600 cursor-pointer mt-1"
            aria-label={`Select ${form?.title}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-10 h-10 bg-indigo-600/15 border border-indigo-500/25 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-400">
                  <Icon name={getTypeIcon(form?.type)} size={18} color="#818CF8" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base text-white truncate">{form?.title}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${getStatusBadge(form?.status)}`}>
                    {form?.status}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs md:text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">{form?.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
              <span className="flex items-center gap-1">
                <Icon name="Calendar" size={13} className="text-gray-400" />
                {form?.createdDate}
              </span>
              <span className="flex items-center gap-1">
                <Icon name={getTypeIcon(form?.type)} size={13} className="text-gray-400" />
                {form?.type}
              </span>
            </div>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-smooth"
            >
              <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
              <Icon name={showDetails ? 'ChevronUp' : 'ChevronDown'} size={14} />
            </button>

            {showDetails && (
              <div className="mt-3 pt-3 border-t border-[#1F2937] space-y-2 bg-[#0A0F1E] p-3 rounded-lg border border-[#1F2937]/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Audience:</span>
                  <span className="text-white font-medium">{form?.audience}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Language:</span>
                  <span className="text-white font-medium">{form?.language}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Responses:</span>
                  <span className="text-white font-medium">{form?.responses}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#1F2937]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(form)}
            iconName="Edit"
            iconPosition="left"
            iconSize={14}
            fullWidth
            disabled={busy}
            className="text-xs"
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopy(form?.googleFormLink)}
            iconName="Copy"
            iconPosition="left"
            iconSize={14}
            fullWidth
            disabled={busy}
            className="text-xs"
          >
            Copy Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAnalytics?.(form)}
            iconName="BarChart3"
            iconPosition="left"
            iconSize={14}
            fullWidth
            disabled={busy}
            className="text-xs"
          >
            Analytics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRegenerate(form)}
            iconName="RefreshCw"
            iconPosition="left"
            iconSize={14}
            fullWidth
            disabled={busy}
            className="text-xs"
          >
            Regenerate
          </Button>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(form?.id)}
          iconName="Trash2"
          iconPosition="left"
          iconSize={14}
          fullWidth
          disabled={busy}
          className="mt-2 text-xs"
        >
          Delete Form
        </Button>
      </div>
    </div>
  );
};

export default FormCard;