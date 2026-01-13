import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MapPin, Phone, ChevronRight, ChevronDown, Car, Users, Star, Award } from 'lucide-react';
import { useFeaturedVehicles } from '@/hooks/usePublicVehicles';
import { PublicVehicleCard } from '@/components/public/PublicVehicleCard';
import { LocationMap } from '@/components/ui/expand-map';
import { StatsCard } from '@/components/ui/stats-card';
import logoImg from '@/assets/logo-invest-veiculos.png';

export default function Home() {
  const { data: featuredVehicles, isLoading } = useFeaturedVehicles(6);
  const [introPhase, setIntroPhase] = useState<'logo' | 'video' | 'frozen'>('logo');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Logo aparece e sai, depois inicia o vídeo
    const logoTimer = setTimeout(() => {
      setIntroPhase('video');
      // Inicia o vídeo após a transição
      setTimeout(() => {
        videoRef.current?.play();
      }, 500);
    }, 3000); // Logo fica 3 segundos

    return () => clearTimeout(logoTimer);
  }, []);

  const handleVideoEnd = () => {
    // Congela no último frame
    if (videoRef.current) {
      videoRef.current.pause();
      setIntroPhase('frozen');
    }
  };

  const openGoogleMaps = () => {
    window.open(
      "https://www.google.com/maps/search/?api=1&query=Av.+Maj.+Joaquim+Monteiro+Patto,+25+-+Chácara+do+Visconde,+Taubaté+-+SP,+12050-620",
      "_blank"
    );
  };

  return (
    <div className="bg-black text-white">
      {/* Hero Section - Logo Intro → Video → Freeze */}
      <section className="relative h-screen overflow-hidden bg-black">
        
        {/* Logo Intro Animation */}
        <AnimatePresence>
          {introPhase === 'logo' && (
            <motion.div
              className="absolute inset-0 z-20 flex items-center justify-center bg-black"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.img
                src={logoImg}
                alt="Invest Veículos"
                className="h-28 md:h-40 lg:h-48 w-auto object-contain"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 1 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video - cropped to hide watermark, freezes on last frame */}
        <video
          ref={videoRef}
          muted
          playsInline
          onEnded={handleVideoEnd}
          className={`absolute inset-0 w-full h-full object-cover scale-110 transition-opacity duration-500 ${introPhase === 'logo' ? 'opacity-0' : 'opacity-100'}`}
        >
          <source src="/videos/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay when frozen */}
        <motion.div
          className="absolute inset-0 bg-black/50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: introPhase === 'frozen' ? 1 : 0 }}
          transition={{ duration: 1.5 }}
        />

        {/* Phrase appears after video freezes */}
        <AnimatePresence>
          {introPhase === 'frozen' && (
            <motion.div
              className="absolute inset-0 z-10 flex items-end justify-center pb-24 md:pb-32"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <motion.p
                className="text-xl md:text-2xl lg:text-3xl font-light text-white/90 italic text-center max-w-4xl px-6 tracking-wide"
                style={{ 
                  textShadow: "0 4px 30px rgba(0,0,0,0.8)",
                  fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                Qualidade que se vê. <span className="text-[#E59935] font-normal not-italic">Confiança</span> que você sente
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Featured Vehicles Section */}
      <section className="py-24 bg-zinc-950">
        <div className="container mx-auto px-6">
          <motion.div
            className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <span className="text-[#E53935] text-sm font-medium uppercase tracking-widest mb-4 block">
                Destaques
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight">
                Nosso <span className="text-white/50">Estoque</span>
              </h2>
            </div>
            <Link to="/veiculos">
              <motion.button
                className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                whileHover={{ x: 5 }}
              >
                Ver todos os veículos
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-zinc-900 rounded-2xl h-[420px] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
      <section className="relative py-20 md:py-28 bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-transparent to-zinc-950" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
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
      <section className="py-24 bg-zinc-950">
        <div className="container mx-auto px-6">
          <motion.div
            className="grid lg:grid-cols-2 gap-12 items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Info */}
            <div>
              <span className="text-[#E53935] text-sm font-medium uppercase tracking-widest mb-4 block">
                Onde Estamos
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">
                Visite nossa <span className="text-white/50">Loja</span>
              </h2>

              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E53935]/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-[#E53935]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Endereço</h3>
                    <p className="text-white/60 leading-relaxed">
                      Av. Maj. Joaquim Monteiro Patto, 25<br />
                      Chácara do Visconde - Taubaté/SP
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E53935]/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-[#E53935]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Horário</h3>
                    <p className="text-white/60 leading-relaxed">
                      Segunda a Sexta: 08:00 às 18:00<br />
                      Sábado: 08:00 às 12:30
                    </p>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={openGoogleMaps}
                className="group flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 hover:border-white/20 transition-all"
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
                className="w-full aspect-square rounded-2xl"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
