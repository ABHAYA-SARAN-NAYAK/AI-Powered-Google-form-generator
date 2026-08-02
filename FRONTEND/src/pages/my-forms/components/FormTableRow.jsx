import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FormTableRow = ({ form, isSelected, onSelect, onEdit, onCopy, onView, onAnalytics, onRegenerate, onDelete, busy = false }) => {
  const [showActions, setShowActions] = useState(false);

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
    <tr className="border-b border-[#1F2937] hover:bg-[#1A2235]/60 transition-smooth">
      <td className="px-4 py-3.5 lg:px-6 lg:py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(form?.id, e?.target?.checked)}
          className="w-4 h-4 rounded border-[#1F2937] bg-[#0A0F1E] text-indigo-500 focus:ring-2 focus:ring-primary focus:ring-offset-[#0A0F1E] accent-indigo-600 cursor-pointer"
          aria-label={`Select ${form?.title}`}
        />
      </td>
      <td className="px-4 py-3.5 lg:px-6 lg:py-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-indigo-600/15 border border-indigo-500/25 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-400">
            <Icon name={getTypeIcon(form?.type)} size={18} color="#818CF8" />
          </div>
          <div className="min-w-0">
            <button
              onClick={() => onView(form)}
              className="font-semibold text-sm lg:text-base text-white hover:text-indigo-400 transition-smooth text-left truncate block max-w-md"
            >
              {form?.title}
            </button>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{form?.description}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 lg:px-6 lg:py-4 hidden md:table-cell">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-600/15 text-indigo-300 border border-indigo-500/30">
          <Icon name={getTypeIcon(form?.type)} size={13} color="#818CF8" />
          {form?.type}
        </span>
      </td>
      <td className="px-4 py-3.5 lg:px-6 lg:py-4 hidden lg:table-cell">
        <span className="text-xs lg:text-sm text-gray-400 font-medium">{form?.createdDate}</span>
      </td>
      <td className="px-4 py-3.5 lg:px-6 lg:py-4 hidden lg:table-cell">
        <span className="text-xs lg:text-sm text-gray-300">{form?.audience}</span>
      </td>
      <td className="px-4 py-3.5 lg:px-6 lg:py-4 hidden xl:table-cell">
        <span className="text-xs lg:text-sm text-gray-300">{form?.language}</span>
      </td>
      <td className="px-4 py-3.5 lg:px-6 lg:py-4 hidden md:table-cell">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(form?.status)}`}>
          {form?.status}
        </span>
      </td>
      <td className="px-4 py-3.5 lg:px-6 lg:py-4">
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(form)}
            className="hidden lg:inline-flex text-gray-400 hover:text-white hover:bg-white/10"
            aria-label="Edit form"
            disabled={busy}
          >
            <Icon name="Edit" size={17} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCopy(form?.googleFormLink)}
            className="hidden lg:inline-flex text-gray-400 hover:text-white hover:bg-white/10"
            aria-label="Copy link"
            disabled={busy}
          >
            <Icon name="Copy" size={17} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAnalytics?.(form)}
            className="hidden lg:inline-flex text-gray-400 hover:text-white hover:bg-white/10"
            aria-label="View analytics"
            disabled={busy}
          >
            <Icon name="BarChart3" size={17} />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowActions(!showActions)}
              aria-label="More actions"
              aria-expanded={showActions}
              disabled={busy}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <Icon name="MoreVertical" size={17} />
            </Button>
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-50"
                  onClick={() => setShowActions(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A2235] border border-[#1F2937] rounded-xl shadow-2xl z-200 animate-slide-in overflow-hidden">
                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        onEdit(form);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-smooth text-gray-200 hover:text-white text-xs font-medium"
                    >
                      <Icon name="Edit" size={15} />
                      Edit Parameters
                    </button>
                    <button
                      onClick={() => {
                        onCopy(form?.googleFormLink);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-smooth text-gray-200 hover:text-white text-xs font-medium"
                    >
                      <Icon name="Copy" size={15} />
                      Copy Link
                    </button>
                    <button
                      onClick={() => {
                        onAnalytics?.(form);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-smooth text-gray-200 hover:text-white text-xs font-medium"
                    >
                      <Icon name="BarChart3" size={15} />
                      View Analytics
                    </button>
                    <button
                      onClick={() => {
                        onRegenerate(form);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-smooth text-gray-200 hover:text-white text-xs font-medium"
                    >
                      <Icon name="RefreshCw" size={15} />
                      Regenerate
                    </button>
                    <div className="border-t border-[#1F2937] my-1" />
                    <button
                      onClick={() => {
                        onDelete(form?.id);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-smooth text-red-400 text-xs font-medium"
                    >
                      <Icon name="Trash2" size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

export default FormTableRow;