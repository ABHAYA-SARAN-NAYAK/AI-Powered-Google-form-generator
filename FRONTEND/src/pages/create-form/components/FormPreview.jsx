import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FormPreview = ({ formData, onCopy, onOpen, onRegenerate, onSave, onOptimize, isGenerating, isOptimizing }) => {

  if (!formData) return null;

  return (
    <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-5 md:p-6 lg:p-8 transition-smooth overflow-hidden shadow-xl">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold text-white">
          Generated Form Preview
        </h3>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/15 border border-emerald-500/30 rounded-full">
          <Icon name="CheckCircle2" size={16} color="#34D399" />
          <span className="text-xs md:text-sm font-semibold text-emerald-400">Generated</span>
        </div>
      </div>
      <div className="space-y-4 md:space-y-6">
        <div className="bg-[#0A0F1E] border border-[#1F2937] rounded-xl p-4 md:p-5 lg:p-6 shadow-inner">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600/15 border border-indigo-500/25 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-400">
              <Icon name="FileText" size={22} color="#818CF8" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base md:text-lg lg:text-xl font-heading font-semibold text-white mb-1">
                {formData?.title}
              </h4>
              <p className="text-xs md:text-sm text-gray-400">
                {formData?.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 bg-[#111827] p-3 rounded-lg border border-[#1F2937]">
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
              <Icon name="FileType" size={16} className="text-gray-400" />
              <span>
                <span className="font-semibold text-gray-400">Type:</span> {formData?.type}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
              <Icon name="Users" size={16} className="text-gray-400" />
              <span>
                <span className="font-semibold text-gray-400">Audience:</span> {formData?.audience}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
              <Icon name="Globe" size={16} className="text-gray-400" />
              <span>
                <span className="font-semibold text-gray-400">Language:</span> {formData?.language}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
              <Icon name="MessageSquare" size={16} className="text-gray-400" />
              <span>
                <span className="font-semibold text-gray-400">Tone:</span> {formData?.tone}
              </span>
            </div>
          </div>

          <div className="border-t border-[#1F2937] pt-4">
            <p className="text-xs md:text-sm font-semibold text-gray-200 mb-3">
              Form Questions Preview:
            </p>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 scrollbar-custom">
              {formData?.questions?.map((question, index) => (
                <div key={index} className="flex items-start gap-2.5 text-xs md:text-sm text-gray-300 bg-[#111827]/60 p-2.5 rounded-lg border border-[#1F2937]/50">
                  <span className="font-bold text-indigo-400 flex-shrink-0">{index + 1}.</span>
                  <span className="min-w-0 break-words">{question}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-indigo-600/10 rounded-xl p-4 md:p-5 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Link" size={18} color="#818CF8" />
            <p className="text-sm md:text-base font-semibold text-white">
              Google Form Link
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-nowrap gap-2 md:gap-3 min-w-0">
            <div className="flex-1 min-w-0 bg-[#0A0F1E] rounded-lg px-3 md:px-4 py-2.5 md:py-3 border border-[#1F2937]">
              <p className="text-xs md:text-sm text-gray-300 font-mono break-all sm:truncate">
                {formData?.googleFormLink}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="default"
                iconName="Copy"
                iconPosition="left"
                onClick={onCopy}
                fullWidth
                className="sm:w-auto text-xs"
              >
                Copy
              </Button>
              <Button
                variant="default"
                size="default"
                iconName="ExternalLink"
                iconPosition="left"
                onClick={onOpen}
                fullWidth
                className="sm:w-auto text-xs"
              >
                Open
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 pt-2">
          <Button
            variant="outline"
            size="lg"
            iconName="RefreshCw"
            iconPosition="left"
            onClick={onRegenerate}
            disabled={isGenerating || isOptimizing}
            fullWidth
            className="text-xs font-semibold"
          >
            Regenerate
          </Button>
          <Button
            variant="default"
            size="lg"
            iconName="Sparkles"
            iconPosition="left"
            onClick={onOptimize}
            disabled={isGenerating || isOptimizing}
            fullWidth
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
          >
            {isOptimizing ? 'Optimizing...' : '✨ Optimize with AI'}
          </Button>
          <Button
            variant="default"
            size="lg"
            iconName="Save"
            iconPosition="left"
            onClick={onSave}
            disabled={isGenerating || isOptimizing}
            fullWidth
            className="text-xs font-semibold"
          >
            Save Form
          </Button>
        </div>
      </div>
    </div>
  );
};


export default FormPreview;