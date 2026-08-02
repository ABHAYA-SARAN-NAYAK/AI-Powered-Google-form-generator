import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FormCard = ({ form, onCopyLink, onOpenForm, onRegenerate }) => {
  const getTypeIcon = (type) => {
    const icons = {
      Survey: 'ClipboardList',
      Quiz: 'GraduationCap',
      Feedback: 'MessageSquare',
      Registration: 'UserPlus'
    };
    return icons?.[type] || 'FileText';
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d?.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="bg-[#111827] rounded-xl border border-[#1F2937] border-l-4 border-l-[#6366F1] p-5 md:p-6 shadow-xl hover:border-indigo-500/40 transition-smooth group flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center flex-shrink-0 text-indigo-400 group-hover:bg-indigo-600/25 transition-smooth">
              <Icon name={getTypeIcon(form?.type)} size={22} color="#818CF8" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-base md:text-lg text-white line-clamp-2 mb-1 group-hover:text-indigo-300 transition-smooth">
                {form?.title}
              </h3>
              {form?.createdAt && (
                <p className="text-xs text-gray-400">
                  Created {formatDate(form?.createdAt)}
                </p>
              )}
            </div>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
            {form?.type || 'Form'}
          </div>
        </div>

        <div className="space-y-2 mb-5 bg-[#0A0F1E]/50 rounded-lg p-3 border border-[#1F2937]">
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
            <Icon name="Users" size={15} className="text-gray-400 flex-shrink-0" />
            <span className="truncate"><span className="text-gray-400">Audience:</span> {form?.audience}</span>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
            <Icon name="Globe" size={15} className="text-gray-400 flex-shrink-0" />
            <span className="truncate"><span className="text-gray-400">Language:</span> {form?.language}</span>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
            <Icon name="MessageCircle" size={15} className="text-gray-400 flex-shrink-0" />
            <span className="truncate"><span className="text-gray-400">Tone:</span> {form?.tone}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-[#1F2937]">
        <Button
          variant="outline"
          size="sm"
          iconName="Copy"
          iconPosition="left"
          onClick={() => onCopyLink(form?.id)}
          className="flex-1 text-xs"
        >
          Copy Link
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconName="ExternalLink"
          iconPosition="left"
          onClick={() => onOpenForm(form?.id)}
          className="flex-1 text-xs"
        >
          Open
        </Button>
        <Button
          variant="ghost"
          size="sm"
          iconName="RefreshCw"
          onClick={() => onRegenerate(form?.id)}
          className="flex-shrink-0 text-gray-400 hover:text-white"
          aria-label="Regenerate form"
        />
      </div>
    </div>
  );
};

export default FormCard;