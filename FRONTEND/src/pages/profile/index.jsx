import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const Profile = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Profile - AI Form Generator</title>
        <meta name="description" content="Profile and settings" />
      </Helmet>
      <div className="min-h-screen bg-[#0A0F1E] bg-dot-grid text-white">
        <Header />
        <main className="pt-16">
          <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <div className="bg-[#111827] rounded-xl shadow-xl border border-[#1F2937] p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-600/15 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400 flex-shrink-0">
                  <Icon name="User" size={24} color="#818CF8" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-heading font-bold text-xl md:text-2xl text-white">Profile</h1>
                  <p className="text-sm md:text-base text-gray-400 mt-1">
                    Profile settings are not configured yet.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button variant="default" size="lg" onClick={() => navigate('/dashboard')} className="font-semibold shadow-lg shadow-indigo-600/30">
                  Back to Dashboard
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/')}>
                  Back to Home
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Profile;
