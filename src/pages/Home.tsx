import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MapPin, Phone, ChevronRight, ChevronDown, Car, Users, Star, Award } from 'lucide-react';
import { useFeaturedVehicles } from '@/hooks/usePublicVehicles';
import { PublicVehicleCard } from '@/components/public/PublicVehicleCard';
import { LocationMap } from '@/components/ui/expand-map';
import { StatsCard } from '@/components/ui/stats-card';
import logoImg from '@/assets/logo-invest-veiculos.png';
import heroBgNight from '@/assets/hero-bg-night.jpg';

export default function Home() {
  const { data: featuredVehicles, isLoading } = useFeaturedVehicles(6);
  const [introPhase, setIntroPhase] = useState<'video1' | 'video2' | 'fading' | 'final'>('video1');
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const mobileVideo1Ref = useRef<HTMLVideoElement>(null);
  const mobileVideo2Ref = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detecta se é mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Inicia o primeiro vídeo diretamente
    const startVideo = () => {
      if (isMobile) {
        if (mobileVideo1Ref.current) {
          mobileVideo1Ref.current.play();
        }
      } else {
        video1Ref.current?.play();
      }
    };
    
    // Pequeno delay para garantir que o vídeo está carregado
    const timer = setTimeout(startVideo, 100);
    return () => clearTimeout(timer);
  }, [isMobile]);

  const handleVideo1End = () => {
    // Primeiro vídeo terminou, inicia o segundo
    setIntroPhase('video2');
    setTimeout(() => {
      if (isMobile) {
        mobileVideo2Ref.current?.play();
      } else {
        video2Ref.current?.play();
      }
    }, 100);
  };

  const handleVideo2End = () => {
    // Segundo vídeo terminou, escurece e mostra logo
    setIntroPhase('fading');
    setTimeout(() => {
      setIntroPhase('final');
    }, 1500);
  };

  const openGoogleMaps = () => {
    window.open(
      "https://www.google.com/maps/search/?api=1&query=Av.+Maj.+Joaquim+Monteiro+Patto,+25+-+Chácara+do+Visconde,+Taubaté+-+SP,+12050-620",
      "_blank"
    );
  };

  return (
    <div className="bg-public-bg text-public-fg">
      {/* Hero Section - Video → Fade to Black → Logo + Phrase */}
      <section className="relative h-[100dvh] overflow-hidden bg-black">
        
        {/* Dark overlay on video to make it darker - more opacity for mobile */}
        <div 
          className={`absolute inset-0 pointer-events-none z-[5] transition-opacity duration-500 ${
            introPhase === 'video1' || introPhase === 'video2' ? 'opacity-100' : 'opacity-0'
          } bg-black/50 md:bg-black/30`}
        />

        {/* Video 1 - Intro - Desktop */}
        <video
          ref={video1Ref}
          muted
          playsInline
          onEnded={handleVideo1End}
          className={`absolute inset-0 w-full h-full object-cover bg-black transition-opacity duration-500 hidden md:block ${
            introPhase === 'video1' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src="/videos/hero-video.mp4?v=7" type="video/mp4" />
        </video>

        {/* Video 2 - Carro - Desktop */}
        <video
          ref={video2Ref}
          muted
          playsInline
          onEnded={handleVideo2End}
          className={`absolute inset-0 w-full h-full object-cover bg-black transition-opacity duration-500 hidden md:block ${
            introPhase === 'video2' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src="/videos/hero-video-car.mp4?v=1" type="video/mp4" />
        </video>

        {/* Video 1 - Intro - Mobile */}
        <video
          ref={mobileVideo1Ref}
          muted
          playsInline
          onEnded={handleVideo1End}
          className={`absolute inset-0 w-full h-full object-cover bg-black transition-opacity duration-500 md:hidden ${
            introPhase === 'video1' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src="/videos/hero-video.mp4?v=7" type="video/mp4" />
        </video>

        {/* Video 2 - Carro - Mobile */}
        <video
          ref={mobileVideo2Ref}
          muted
          playsInline
          onEnded={handleVideo2End}
          className={`absolute inset-0 w-full h-full object-cover bg-black transition-opacity duration-500 md:hidden ${
            introPhase === 'video2' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src="/videos/hero-video-mobile.mp4?v=7" type="video/mp4" />
        </video>

        {/* Fade to black overlay */}
        <motion.div
          className="absolute inset-0 bg-black pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: introPhase === 'fading' || introPhase === 'final' ? 1 : 0 
          }}
          transition={{ duration: 1.5 }}
        />

        {/* Final State: Background Image + Logo + Phrase */}
        <AnimatePresence>
          {introPhase === 'final' && (
            <motion.div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              {/* Dark background image */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${heroBgNight})`,
                }}
              />
              {/* Extra dark overlay to ensure logo/text stand out */}
              <div className="absolute inset-0 bg-black/60" />
              
              {/* Logo */}
              <motion.img
                src={logoImg}
                alt="Invest Veículos"
                className="relative z-10 h-16 sm:h-24 md:h-32 lg:h-40 w-auto object-contain mb-6 sm:mb-8"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
              
              {/* Phrase - appears after logo */}
              <motion.h2
                className="relative z-10 text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-white text-center max-w-4xl tracking-wide leading-tight px-4"
                style={{ 
                  textShadow: "0 4px 40px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.5)"
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.2 }}
              >
                Qualidade que se vê.{" "}
                <span className="text-public-primary">Confiança</span>{" "}
                que você sente.
              </motion.h2>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Featured Vehicles Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-public-bg">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 sm:mb-12 md:mb-16 gap-4 sm:gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <span className="text-public-primary text-xs sm:text-sm font-medium uppercase tracking-widest mb-2 sm:mb-4 block">
                Destaques
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-public-fg leading-tight">
                Nosso <span className="text-public-fg/50">Estoque</span>
              </h2>
            </div>
            <Link to="/veiculos">
              <motion.button
                className="group flex items-center gap-2 text-sm text-public-fg/60 hover:text-public-fg transition-colors"
                whileHover={{ x: 5 }}
              >
                Ver todos os veículos
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-public-surface rounded-2xl h-[350px] sm:h-[400px] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 1 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
            >
              {featuredVehicles?.slice(0, 6).map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                >
                  <PublicVehicleCard vehicle={vehicle} index={index} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-12 sm:py-16 md:py-24 bg-public-surface">
        <div className="absolute inset-0 bg-gradient-to-b from-public-bg via-transparent to-public-bg" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <StatsCard value={500} suffix="+" label="Veículos Vendidos" icon={Car} index={0} />
            <StatsCard value={20} label="Anos de Mercado" icon={Award} index={1} />
            <StatsCard value={98} suffix="%" label="Clientes Satisfeitos" icon={Users} index={2} />
            <StatsCard value={100} suffix="%" label="Laudo Aprovado" icon={Star} index={3} />
          </motion.div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-public-bg">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Info */}
            <div>
              <span className="text-public-primary text-xs sm:text-sm font-medium uppercase tracking-widest mb-2 sm:mb-4 block">
                Onde Estamos
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-public-fg mb-6 sm:mb-8">
                Visite nossa <span className="text-public-fg/50">Loja</span>
              </h2>

              <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-public-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-public-primary" />
                  </div>
                  <div>
                    <h3 className="text-public-fg font-semibold text-sm sm:text-base mb-1">Endereço</h3>
                    <p className="text-public-fg/60 text-sm sm:text-base leading-relaxed">
                      Av. Maj. Joaquim Monteiro Patto, 25<br />
                      Chácara do Visconde - Taubaté/SP
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-public-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-public-primary" />
                  </div>
                  <div>
                    <h3 className="text-public-fg font-semibold text-sm sm:text-base mb-1">Horário</h3>
                    <p className="text-public-fg/60 text-sm sm:text-base leading-relaxed">
                      Segunda a Sexta: 08:00 às 18:00<br />
                      Sábado: 08:00 às 12:30
                    </p>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={openGoogleMaps}
                className="group flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-public-muted border border-public-border rounded-full text-sm sm:text-base text-public-fg hover:bg-public-primary/10 hover:border-public-primary/30 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MapPin className="w-4 h-4" />
                Como Chegar
              </motion.button>
            </div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <LocationMap
                location="Invest Veículos - Taubaté"
                coordinates="Av. Maj. Joaquim Monteiro Patto, 25"
                className="w-full aspect-[4/3] sm:aspect-square rounded-2xl"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
