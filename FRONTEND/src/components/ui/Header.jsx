import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Header = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [welcome, setWelcome] = useState(null);


  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { label: 'Create Form', path: '/create-form', icon: 'FilePlus' },
    { label: 'My Forms', path: '/my-forms', icon: 'FolderOpen' },
  ];

  const isActivePath = (path) => location?.pathname === path || (path === '/dashboard' && location?.pathname === '/');

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  React.useEffect(() => {
    const onWelcome = (e) => {
      try {
        setWelcome({ name: e?.detail?.name || '' });
        setTimeout(() => setWelcome(null), 3500);
      } catch {
        // noop
      }
    };
    window?.addEventListener?.('app_welcome', onWelcome);
    return () => window?.removeEventListener?.('app_welcome', onWelcome);
  }, []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-100 bg-[#111827]/80 backdrop-blur-xl border-b border-[#1F2937] transition-smooth">
      <div className="max-w-9xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-3 transition-smooth hover:opacity-90">
              <img 
                src="https://res.cloudinary.com/dkht5j3tw/image/upload/v1784888561/ChatGPT_Image_Jul_24_2026_03_52_14_PM_t9uvln.png" 
                alt="AI Form Generator Logo" 
                className="w-10 h-10 object-contain rounded-xl bg-[#111827] border border-[#1F2937] p-1"
              />
              <span className="font-heading font-bold text-xl text-white hidden sm:block tracking-tight">
                AI Form Generator
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1.5">
              {navigationItems?.map((item) => {
                const active = isActivePath(item?.path);
                return (
                  <Link
                    key={item?.path}
                    to={item?.path}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-smooth
                      ${active
                        ? 'bg-primary text-white font-semibold shadow-md shadow-primary/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium'
                      }
                    `}
                  >
                    <Icon name={item?.icon} size={18} />
                    <span>{item?.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg border border-[#1F2937] bg-[#111827] text-gray-300 hover:text-white hover:bg-[#1F2937]/60 flex items-center justify-center transition-smooth theme-toggle-btn"
              aria-label="Toggle theme"
            >
              <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} />
            </button>

            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[#1F2937] bg-[#111827] hover:bg-[#1F2937]/60 transition-smooth"
                aria-label="User menu"
                aria-expanded={isUserMenuOpen}
              >
                <div className="w-8 h-8 bg-gradient-to-tr from-primary to-indigo-400 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-inner">
                  <Icon name="User" size={16} color="#FFFFFF" />
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-semibold text-white max-w-[160px] truncate">
                    {user?.name || 'Account'}
                  </span>
                  <span className="text-xs text-gray-400 max-w-[160px] truncate">
                    {user?.email || ''}
                  </span>
                </div>
                <Icon name="ChevronDown" size={16} className={`text-gray-400 transition-smooth ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-50"
                    onClick={toggleUserMenu}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#1A2235] border border-[#1F2937] rounded-xl shadow-2xl z-200 animate-slide-in overflow-hidden">
                    <div className="p-4 border-b border-[#1F2937] bg-[#111827]/50">
                      <p className="font-semibold text-sm text-white">User Account</p>
                      <p className="text-xs text-gray-400 mt-1 truncate">{user?.name || ''}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email || ''}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-smooth text-gray-300 hover:text-white text-sm"
                        onClick={toggleUserMenu}
                      >
                        <Icon name="Settings" size={18} />
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={async () => {
                          toggleUserMenu();
                          await logout();
                          navigate('/login', { replace: true });
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-smooth text-red-400 hover:text-red-300 text-sm"
                      >
                        <Icon name="LogOut" size={18} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg border border-[#1F2937] text-gray-300 hover:text-white bg-[#111827] hover:bg-[#1F2937] transition-smooth"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Icon name={isMobileMenuOpen ? 'X' : 'Menu'} size={22} />
            </button>
          </div>
        </div>
      </div>
      {welcome && (
        <div className="fixed top-20 right-4 z-300 animate-slide-in">
          <div className="bg-emerald-600 text-white rounded-xl shadow-xl px-4 py-3 border border-emerald-500 flex items-center gap-3">
            <Icon name="Smile" size={18} />
            <div>
              <p className="text-sm font-semibold">Welcome{welcome?.name ? `, ${welcome.name}` : ''}!</p>
              <p className="text-xs text-emerald-100">Glad to see you.</p>
            </div>
          </div>
        </div>
      )}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          <nav className="fixed top-16 left-0 right-0 bottom-0 bg-[#0A0F1E] z-200 lg:hidden overflow-y-auto border-t border-[#1F2937]">
            <div className="p-4 space-y-2">
              {navigationItems?.map((item) => (
                <Link
                  key={item?.path}
                  to={item?.path}
                  onClick={closeMobileMenu}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth
                    ${isActivePath(item?.path)
                      ? 'bg-primary text-white font-semibold'
                      : 'text-gray-300 hover:bg-[#111827]'
                    }
                  `}
                >
                  <Icon name={item?.icon} size={20} />
                  <span className="font-medium">{item?.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}
    </header>
  );
};

export default Header;