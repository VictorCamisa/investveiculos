import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import logoImg from '@/assets/logo-invest-veiculos.png';

const navLinks = [
  { href: '/', label: 'Início' },
  { href: '/veiculos', label: 'Veículos' },
];

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress (0 to 1) based on first 100px of scroll
      const progress = Math.min(window.scrollY / 100, 1);
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Dynamic styles based on scroll
  const headerHeight = 80 - (scrollProgress * 16); // 80px to 64px
  const bgOpacity = 0.95 - (scrollProgress * 0.25); // 95% to 70%
  const logoScale = 1 - (scrollProgress * 0.15); // 100% to 85%

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/10 transition-all duration-300"
      style={{
        height: `${headerHeight}px`,
        backgroundColor: `rgba(24, 24, 27, ${bgOpacity})`,
        boxShadow: `0 4px 30px rgba(0,0,0,${0.3 - scrollProgress * 0.1})`
      }}
    >
      <div className="container mx-auto px-4">
        <div 
          className="flex items-center justify-between transition-all duration-300"
          style={{ height: `${headerHeight}px` }}
        >
          {/* Logo */}
          <Link to="/" className="relative z-10 transition-transform duration-300" style={{ transform: `scale(${logoScale})` }}>
            <img 
              src={logoImg} 
              alt="Matheus Veículos" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative text-sm font-medium uppercase tracking-wide transition-colors hover:text-public-primary ${
                  location.pathname === link.href 
                    ? 'text-public-primary' 
                    : 'text-white'
                }`}
              >
                {link.label}
                {location.pathname === link.href && (
                  <motion.div
                    layoutId="activeNavLink"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-public-primary"
                  />
                )}
              </Link>
            ))}
            
            {/* Acesso Equipe */}
            <Link
              to="/auth"
              className="ml-4 px-4 py-2 text-xs font-semibold uppercase tracking-wide border border-public-primary text-public-primary rounded-full hover:bg-public-primary hover:text-white transition-all duration-300"
            >
              Acesso Equipe
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative z-10 p-2 text-white"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-public-bg border-t border-public-border"
          >
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-lg font-medium uppercase tracking-wide transition-colors ${
                    location.pathname === link.href 
                      ? 'text-public-primary' 
                      : 'text-public-fg hover:text-public-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Acesso Equipe - Mobile */}
              <Link
                to="/auth"
                className="mt-4 text-center px-4 py-3 text-sm font-semibold uppercase tracking-wide border border-public-primary text-public-primary rounded-full hover:bg-public-primary hover:text-white transition-all"
              >
                Acesso Equipe
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
