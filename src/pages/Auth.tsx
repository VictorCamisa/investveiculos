import React, { useRef, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo-matheus-veiculos.png';

// Animated dots background component
const AnimatedDots = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });

    resizeObserver.observe(canvas.parentElement as Element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate dots
    const dots: { x: number; y: number; radius: number; opacity: number; vx: number; vy: number }[] = [];
    const gap = 40;

    for (let x = 0; x < dimensions.width; x += gap) {
      for (let y = 0; y < dimensions.height; y += gap) {
        if (Math.random() > 0.3) {
          dots.push({
            x: x + Math.random() * 20 - 10,
            y: y + Math.random() * 20 - 10,
            radius: Math.random() * 1.5 + 0.5,
            opacity: Math.random() * 0.5 + 0.1,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
          });
        }
      }
    }

    // Lines connecting nearby dots
    const lines: { from: number; to: number }[] = [];
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dist = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
        if (dist < 80 && Math.random() > 0.7) {
          lines.push({ from: i, to: j });
        }
      }
    }

    let animationFrameId: number;

    function animate() {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Update and draw dots
      dots.forEach(dot => {
        dot.x += dot.vx;
        dot.y += dot.vy;

        if (dot.x < 0 || dot.x > dimensions.width) dot.vx *= -1;
        if (dot.y < 0 || dot.y > dimensions.height) dot.vy *= -1;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity})`;
        ctx.fill();
      });

      // Draw connecting lines
      lines.forEach(line => {
        const from = dots[line.from];
        const to = dots[line.to];
        const dist = Math.hypot(from.x - to.x, from.y - to.y);
        const opacity = Math.max(0, (80 - dist) / 80) * 0.15;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  );
};

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);

  const { signIn, user, session } = useAuth();
  const { isLoading: permissionsLoading, getFirstAccessibleRoute } = usePermissions();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle redirect after login or when user is already logged in
  useEffect(() => {
    // Only redirect when we have user, session, and permissions are fully loaded
    if (user && session && !permissionsLoading) {
      const firstRoute = getFirstAccessibleRoute();
      navigate(firstRoute, { replace: true });
      setPendingRedirect(false);
      setIsLoading(false);
    }
  }, [user, session, permissionsLoading, getFirstAccessibleRoute, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao entrar',
        description: error.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos'
          : error.message,
      });
      setIsLoading(false);
    } else {
      // Set pending redirect - will redirect once permissions are loaded
      setPendingRedirect(true);
      // Keep loading state until redirect happens
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-zinc-950">
      {/* Left side - Visual */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />

        {/* Animated dots */}
        <AnimatedDots />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors w-fit group text-sm"
          >
            <motion.span
              className="group-hover:-translate-x-1 transition-transform"
            >
              ←
            </motion.span>
            Voltar ao site
          </Link>

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-6"
          >
            <img 
              src={logo} 
              alt="Matheus Veículos" 
              className="h-12 brightness-0 invert opacity-90"
            />

            <div>
              <h1 className="text-4xl xl:text-5xl font-light text-white tracking-tight">
                Sistema de Gestão
              </h1>
              <p className="text-4xl xl:text-5xl font-light text-zinc-500 tracking-tight">
                Automotiva
              </p>
            </div>

            <p className="text-zinc-500 text-lg max-w-md leading-relaxed">
              Gerencie seu estoque, vendas e equipe em uma única plataforma inteligente.
            </p>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-zinc-700 text-sm"
          >
            © {new Date().getFullYear()} Matheus Veículos
          </motion.div>
        </div>
      </motion.div>

      {/* Right side - Form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white"
      >
        <div className="w-full max-w-md">
          {/* Mobile back button */}
          <Link
            to="/"
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors mb-6 group text-sm font-medium"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Voltar ao site
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-10"
          >
            <h2 className="text-3xl font-semibold text-zinc-900 tracking-tight">
              Bem-vindo
            </h2>
            <p className="mt-2 text-zinc-500">
              Entre com suas credenciais
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 rounded-xl outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full h-12 px-4 pr-12 bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 rounded-xl outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/5 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.div
              className="pt-2"
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
            >
              <motion.button
                type="submit"
                disabled={isLoading}
                className="relative w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <>
                      Entrar
                      <motion.span
                        animate={{ x: isHovered ? 4 : 0 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.span>
                    </>
                  )}
                </span>
              </motion.button>
            </motion.div>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          </motion.form>


          {/* Mobile footer */}
          <p className="lg:hidden text-center text-zinc-400 text-xs mt-10">
            © {new Date().getFullYear()} Matheus Veículos
          </p>
        </div>
      </motion.div>
    </div>
  );
}
