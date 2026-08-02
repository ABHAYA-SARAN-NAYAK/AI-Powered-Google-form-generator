import React from 'react';
import Icon from '../../../components/AppIcon';

const DescriptionInput = ({ value, onChange, disabled, error }) => {
  const characterCount = value?.length || 0;
  const maxCharacters = 5000;
  const isNearLimit = characterCount > maxCharacters * 0.8;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label htmlFor="form-description" className="text-sm md:text-base font-semibold text-white">
          Describe Your Form
          <span className="text-red-400 ml-1">*</span>
        </label>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs md:text-sm font-medium ${isNearLimit ? 'text-amber-400' : 'text-gray-400'}`}>
            {characterCount}/{maxCharacters}
          </span>
        </div>
      </div>
      <p className="text-xs md:text-sm text-gray-400">
        Describe what you want in your form using natural language. Be specific about questions, sections, and any special requirements.
      </p>
      <div className="relative">
        <textarea
          id="form-description"
          value={value}
          onChange={(e) => onChange(e?.target?.value)}
          disabled={disabled}
          maxLength={maxCharacters}
          placeholder="Example: I need a student feedback form for my computer science course. Include questions about course content quality, teaching methods, lab sessions, and overall satisfaction. Add a section for suggestions and improvements."
          className={`
            w-full min-h-[180px] md:min-h-[220px] lg:min-h-[240px] px-4 py-3.5 md:px-5 md:py-4
            bg-[#0A0F1E] border rounded-xl
            text-sm md:text-base text-white placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#111827] focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-y transition-smooth shadow-inner
            ${error ? 'border-red-500' : 'border-[#1F2937]'}
          `}
          aria-describedby={error ? 'description-error' : 'description-help'}
          aria-invalid={error ? 'true' : 'false'}
        />
        
        {!value && !disabled && (
          <div className="absolute top-3.5 right-3.5 md:top-4 md:right-4 pointer-events-none">
            <Icon name="Sparkles" size={20} className="text-indigo-400 opacity-50" />
          </div>
        )}
      </div>
      {error && (
        <div id="description-error" className="flex items-center gap-2 text-xs md:text-sm text-red-400 mt-1">
          <Icon name="AlertCircle" size={16} />
          <span>{error}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 rounded-lg">
          <Icon name="Lightbulb" size={14} color="#818CF8" />
          <span className="text-xs text-indigo-300 font-medium">Be specific</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 border border-emerald-500/20 rounded-lg">
          <Icon name="List" size={14} color="#34D399" />
          <span className="text-xs text-emerald-300 font-medium">List all sections</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
          <Icon name="Target" size={14} color="#9CA3AF" />
          <span className="text-xs text-gray-300 font-medium">Mention question types</span>
        </div>
      </div>
    </div>
  );
};

export default DescriptionInput;