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
import introGif from '@/assets/intro-animation.gif';

export default function Home() {
  const { data: featuredVehicles, isLoading } = useFeaturedVehicles(6);
  const [introPhase, setIntroPhase] = useState<'logo' | 'transition' | 'video' | 'fading' | 'final'>('logo');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detecta se é mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // GIF aparece por 3 segundos, depois transição suave para o vídeo
    const logoTimer = setTimeout(() => {
      // Primeiro entra na fase de transição (tela preta)
      setIntroPhase('transition');
      
      // Após 0.7s de tela preta, inicia o vídeo
      setTimeout(() => {
        setIntroPhase('video');
        // Pequeno delay antes de dar play no vídeo
        setTimeout(() => {
          if (isMobile) {
            if (mobileVideoRef.current) {
              const videoDuration = mobileVideoRef.current.duration || 10;
              mobileVideoRef.current.playbackRate = videoDuration / 5;
              mobileVideoRef.current.play();
            }
          } else {
            videoRef.current?.play();
          }
        }, 200);
      }, 700);
    }, 3000); // GIF fica 3 segundos

    return () => clearTimeout(logoTimer);
  }, [isMobile]);

  const handleVideoEnd = () => {
    // Quando o vídeo termina, faz fade para tela preta e mostra o GIF novamente
    setIntroPhase('fading');
    setTimeout(() => {
      setIntroPhase('final');
    }, 500);
  };

  const openGoogleMaps = () => {
    window.open(
      "https://www.google.com/maps/search/?api=1&query=Av.+Maj.+Joaquim+Monteiro+Patto,+25+-+Chácara+do+Visconde,+Taubaté+-+SP,+12050-620",
      "_blank"
    );
  };

  return (
    <div className="bg-public-bg text-public-fg">
      {/* Hero Section - Logo Intro → Video → Fade to Black → Logo + Phrase */}
      <section className="relative h-[100dvh] overflow-hidden bg-black">
        
        {/* GIF Animation (início e final) */}
        <AnimatePresence>
          {(introPhase === 'logo' || introPhase === 'final') && (
            <motion.div
              className="absolute inset-0 z-20 flex items-center justify-center bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.img
                src={introGif}
                alt="Invest Veículos"
                className="h-32 sm:h-40 md:h-56 lg:h-64 w-auto object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transition phase - tela preta suave antes do vídeo */}
        <AnimatePresence>
          {introPhase === 'transition' && (
            <motion.div
              className="absolute inset-0 z-20 bg-black"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </AnimatePresence>

        {/* Fade to black overlay when video ends */}
        <motion.div
          className="absolute inset-0 bg-black pointer-events-none z-15"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: introPhase === 'fading' || introPhase === 'final' ? 1 : 0 
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Dark overlay on video to make it darker */}
        <div 
          className={`absolute inset-0 pointer-events-none z-[5] transition-opacity duration-500 ${
            introPhase === 'video' ? 'opacity-100' : 'opacity-0'
          } bg-black/60`}
        />

        {/* Video - Desktop */}
        <video
          ref={videoRef}
          muted
          playsInline
          onEnded={handleVideoEnd}
          className={`absolute inset-0 w-full bg-black transition-opacity duration-500 hidden md:block ${
            introPhase === 'logo' || introPhase === 'transition' || introPhase === 'final' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ 
            height: '115%', 
            top: '-7.5%',
            objectFit: 'cover',
            objectPosition: 'center top'
          }}
        >
          <source src="/videos/hero-video-new.mp4" type="video/mp4" />
        </video>

        {/* Video - Mobile - mesmo vídeo */}
        <video
          ref={mobileVideoRef}
          muted
          playsInline
          onEnded={handleVideoEnd}
          className={`absolute inset-0 w-full bg-black transition-opacity duration-500 md:hidden ${
            introPhase === 'logo' || introPhase === 'transition' || introPhase === 'final' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ 
            height: '115%', 
            top: '-7.5%',
            objectFit: 'cover',
            objectPosition: 'center top'
          }}
        >
          <source src="/videos/hero-video-new.mp4" type="video/mp4" />
        </video>


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
