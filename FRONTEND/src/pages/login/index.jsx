import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { beginGoogleLogin } from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    try {
      setError(null);
      setIsLoading(true);
      await beginGoogleLogin();
    } catch (err) {
      setIsLoading(false);
      setError('Unable to connect to Google. Please try again.');
    }
  };

  // Show nothing while checking auth to avoid flash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] bg-dot-grid flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sign In - AI Form Generator</title>
        <meta name="description" content="Sign in to AI Form Generator to create and manage intelligent Google Forms with AI assistance." />
      </Helmet>

      <div className="min-h-screen bg-[#0A0F1E] bg-dot-grid text-white flex relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Left side - Branding panel (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] flex-col justify-between p-12 xl:p-16 relative">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="https://res.cloudinary.com/dkht5j3tw/image/upload/v1784888561/ChatGPT_Image_Jul_24_2026_03_52_14_PM_t9uvln.png"
              alt="AI Form Generator Logo"
              className="w-11 h-11 object-contain rounded-xl bg-[#111827] border border-[#1F2937] p-1.5"
            />
            <span className="font-heading font-bold text-xl text-white tracking-tight">
              AI Form Generator
            </span>
          </div>

          {/* Hero content */}
          <div className="max-w-lg">
            <h2 className="font-heading font-bold text-4xl xl:text-5xl text-white mb-5 tracking-tight leading-[1.15]">
              Create intelligent forms
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400">
                powered by AI
              </span>
            </h2>
            <p className="text-base xl:text-lg text-gray-400 leading-relaxed mb-10">
              Generate professional Google Forms in seconds. Our AI understands your needs and crafts perfectly structured forms — from surveys to quizzes.
            </p>

            {/* Feature highlights */}
            <div className="space-y-4">
              {[
                { icon: 'Sparkles', text: 'AI-powered form generation from natural language' },
                { icon: 'Zap', text: 'Instantly published to your Google Drive' },
                { icon: 'Shield', text: 'Secure OAuth — we never store your password' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3.5 group">
                  <div className="flex-shrink-0 w-9 h-9 bg-indigo-600/15 border border-indigo-500/25 rounded-lg flex items-center justify-center group-hover:bg-indigo-600/25 transition-smooth">
                    <Icon name={feature.icon} size={18} color="#818CF8" />
                  </div>
                  <span className="text-sm text-gray-300 font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div />
        </div>

        {/* Right side - Login card */}
        <div className="w-full lg:w-[45%] xl:w-[40%] flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-[420px]">
            {/* Mobile logo - only shown on small screens */}
            <div className="flex items-center justify-center gap-3 mb-10 lg:hidden">
              <img
                src="https://res.cloudinary.com/dkht5j3tw/image/upload/v1784888561/ChatGPT_Image_Jul_24_2026_03_52_14_PM_t9uvln.png"
                alt="AI Form Generator Logo"
                className="w-10 h-10 object-contain rounded-xl bg-[#111827] border border-[#1F2937] p-1"
              />
              <span className="font-heading font-bold text-lg text-white tracking-tight">
                AI Form Generator
              </span>
            </div>

            {/* Login card */}
            <div className="bg-[#111827]/80 backdrop-blur-xl border border-[#1F2937] rounded-2xl shadow-2xl p-8 sm:p-10 relative overflow-hidden">
              {/* Subtle top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60" />

              {/* Header */}
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-indigo-600/15 border border-indigo-500/30 rounded-2xl mb-5">
                  <Icon name="Sparkles" size={30} color="#818CF8" />
                  <div className="absolute inset-0 rounded-2xl border border-indigo-500/20 animate-pulse" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white mb-2 tracking-tight">
                  Welcome back
                </h1>

                <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                  Sign in with your Google account to start creating AI-powered forms.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-center font-medium flex items-center justify-center gap-2">
                  <Icon name="AlertCircle" size={16} color="#F87171" />
                  {error}
                </div>
              )}

              {/* Google Sign-In Button */}
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="h-14 bg-[#0A0F1E]/80 border-[#1F2937] hover:bg-[#1A2235] hover:border-indigo-500/40 transition-all duration-200 rounded-xl group"
              >
                <div className="flex items-center justify-center gap-3">
                  {!isLoading ? (
                    <>
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>

                      <span className="font-semibold text-base text-white">
                        Continue with Google
                      </span>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      <span className="font-medium text-base text-gray-300">
                        Connecting…
                      </span>
                    </div>
                  )}
                </div>
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-[#1F2937]" />
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Secure Login</span>
                <div className="flex-1 h-px bg-[#1F2937]" />
              </div>

              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-6">
                {[
                  { icon: 'Lock', label: 'Encrypted' },
                  { icon: 'Shield', label: 'OAuth 2.0' },
                  { icon: 'Eye', label: 'Private' },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Icon name={badge.icon} size={13} color="#6B7280" />
                    <span className="text-xs text-gray-500 font-medium">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                By signing in, you allow this app to create and edit Google Forms
                in your Google Drive using secure OAuth authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;