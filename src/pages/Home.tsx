import { useState, useEffect, useRef } from 'react';
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
  const [showText, setShowText] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Timing sincronizado com o vídeo:
    // - Texto aparece quando o carro passa (~2.5s)
    // - Logo aparece logo depois (~4s)
    const textTimer = setTimeout(() => setShowText(true), 2500);
    const logoTimer = setTimeout(() => setShowLogo(true), 4000);
    
    return () => {
      clearTimeout(textTimer);
      clearTimeout(logoTimer);
    };
  }, []);

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  const openGoogleMaps = () => {
    window.open(
      "https://www.google.com/maps/search/?api=1&query=Av.+Maj.+Joaquim+Monteiro+Patto,+25+-+Chácara+do+Visconde,+Taubaté+-+SP,+12050-620",
      "_blank"
    );
  };

  return (
    <div className="bg-black text-white">
      {/* Hero Section with Video */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            className="absolute inset-0 w-full h-full object-cover"
            poster="/videos/hero-video.mp4#t=0.1"
          >
            <source src="/videos/hero-video.mp4" type="video/mp4" />
          </video>
          
          {/* Overlay gradient - mais leve para ver o vídeo, mais forte quando texto aparece */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-10"
            animate={{ 
              background: showText 
                ? "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.4), rgba(0,0,0,0.8))"
                : "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.2), rgba(0,0,0,0.6))"
            }}
            transition={{ duration: 1 }}
          />
        </div>

        {/* Content Container */}
        <div className="relative z-20 container mx-auto px-6 flex flex-col items-center justify-center text-center">
          {/* Animated Quote - aparece quando o carro passa */}
          <AnimatePresence>
            {showText && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mb-10"
              >
                <motion.p 
                  className="text-xl md:text-3xl lg:text-4xl font-light text-white italic leading-relaxed max-w-4xl drop-shadow-2xl"
                  style={{ textShadow: "0 4px 30px rgba(0,0,0,0.8)" }}
                  initial={{ letterSpacing: "0.15em" }}
                  animate={{ letterSpacing: "0.03em" }}
                  transition={{ duration: 2, delay: 0.3 }}
                >
                  "Qualidade que se vê.{" "}
                  <span className="text-[#E53935] font-normal">Confiança</span> que você sente"
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logo and CTAs - aparecem depois do texto */}
          <AnimatePresence>
            {showLogo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex flex-col items-center gap-8"
              >
                {/* Logo com efeito de brilho */}
                <motion.div className="relative">
                  <motion.div
                    className="absolute inset-0 bg-white/20 blur-3xl rounded-full"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 0.5, 0.3], scale: [0.5, 1.2, 1] }}
                    transition={{ duration: 2, delay: 0.2 }}
                  />
                  <motion.img
                    src={logoImg}
                    alt="Invest Veículos"
                    className="relative h-20 md:h-28 lg:h-36 w-auto object-contain drop-shadow-2xl"
                    initial={{ filter: "brightness(0.5)" }}
                    animate={{ filter: "brightness(1)" }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                  />
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <Link to="/veiculos">
                    <motion.button
                      className="group relative px-8 py-4 bg-[#E53935] text-white font-semibold rounded-full overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(229,57,53,0.5)]"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Explorar Estoque
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </motion.button>
                  </Link>
                  <Link to="/contato">
                    <motion.button
                      className="px-8 py-4 border border-white/30 text-white font-medium rounded-full backdrop-blur-md bg-white/5 hover:bg-white/15 hover:border-white/50 transition-all"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Falar com Consultor
                    </motion.button>
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scroll Indicator - aparece depois de tudo */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: showLogo ? 1 : 0 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <span className="text-white/50 text-xs uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="w-5 h-5 text-white/50" />
          </motion.div>
        </motion.div>
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
