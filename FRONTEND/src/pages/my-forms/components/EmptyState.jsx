import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const EmptyState = ({ hasFilters, onClearFilters }) => {
  if (hasFilters) {
    return (
      <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-8 lg:p-12 text-center shadow-xl max-w-xl mx-auto">
        <div className="w-16 h-16 lg:w-20 lg:h-20 bg-indigo-600/15 border border-indigo-500/25 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6 text-indigo-400">
          <Icon name="Search" size={32} color="#818CF8" className="lg:w-10 lg:h-10" />
        </div>
        <h3 className="font-heading text-xl lg:text-2xl font-bold text-white mb-2 lg:mb-3">
          No Forms Found
        </h3>
        <p className="text-sm lg:text-base text-gray-400 mb-6 lg:mb-8 max-w-md mx-auto leading-relaxed">
          No forms match your current filters. Try adjusting your search criteria or clear all filters to see all forms.
        </p>
        <Button
          variant="outline"
          onClick={onClearFilters}
          iconName="X"
          iconPosition="left"
          iconSize={18}
        >
          Clear All Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-8 lg:p-12 text-center shadow-xl max-w-xl mx-auto">
      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-indigo-600/15 border border-indigo-500/25 rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6 text-indigo-400">
        <Icon name="FileText" size={32} color="#818CF8" className="lg:w-10 lg:h-10" />
      </div>
      <h3 className="font-heading text-xl lg:text-2xl font-bold text-white mb-2 lg:mb-3">
        No Forms Yet
      </h3>
      <p className="text-sm lg:text-base text-gray-400 mb-6 lg:mb-8 max-w-md mx-auto leading-relaxed">
        You haven't created any forms yet. Start by creating your first AI-powered form with just a simple description.
      </p>
      <Link to="/create-form">
        <Button
          variant="default"
          iconName="Plus"
          iconPosition="left"
          iconSize={18}
          className="font-semibold shadow-lg shadow-indigo-600/30"
        >
          Create Your First Form
        </Button>
      </Link>
    </div>
  );
};

export default EmptyState;