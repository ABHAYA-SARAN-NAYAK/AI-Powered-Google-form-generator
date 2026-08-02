import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Icon from '../components/AppIcon';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0F1E] bg-dot-grid text-white p-4">
      <div className="text-center max-w-md bg-[#111827] border border-[#1F2937] p-8 md:p-10 rounded-2xl shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <h1 className="text-8xl font-bold font-heading text-indigo-500/20 tracking-tighter">404</h1>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-heading text-white mb-2">Page Not Found</h2>
        <p className="text-gray-400 text-sm mb-8">
          The page you're looking for doesn't exist. Let's get you back!
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="default"
            iconName="ArrowLeft"
            iconPosition="left"
            onClick={() => window.history?.back()}
            className="font-semibold shadow-lg shadow-indigo-600/30"
          >
            Go Back
          </Button>

          <Button
            variant="outline"
            iconName="Home"
            iconPosition="left"
            onClick={handleGoHome}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
