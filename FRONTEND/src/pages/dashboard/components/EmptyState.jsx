import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmptyState = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-8 md:p-14 text-center shadow-xl max-w-2xl mx-auto my-8">
      <div className="w-20 h-20 bg-indigo-600/15 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400">
        <Icon name="FileText" size={38} color="#818CF8" />
      </div>
      <h3 className="font-heading font-bold text-xl md:text-2xl lg:text-3xl text-white mb-3">
        No Forms Yet
      </h3>
      <p className="text-sm md:text-base text-gray-400 text-center max-w-md mx-auto mb-8 leading-relaxed">
        Start creating your first AI-powered form by describing what you need. Our intelligent system will generate a professional form for you.
      </p>
      <Button
        variant="default"
        size="lg"
        iconName="Plus"
        iconPosition="left"
        onClick={() => navigate('/create-form')}
      >
        Create Your First Form
      </Button>
    </div>
  );
};

export default EmptyState;