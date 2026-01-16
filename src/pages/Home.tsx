import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, ChevronRight, Car, Users, Star, Award, Shield, Handshake, CheckCircle2, Quote, Clock, Sparkles, FileCheck, HeartHandshake } from 'lucide-react';
import { useFeaturedVehicles } from '@/hooks/usePublicVehicles';
import { PublicVehicleCard } from '@/components/public/PublicVehicleCard';
import { LocationMap } from '@/components/ui/expand-map';
import { StatsCard } from '@/components/ui/stats-card';
import logoImg from '@/assets/logo-invest-veiculos.png';
import lojaNoite from '@/assets/loja-noite.jpg';
import lojaDia from '@/assets/loja-dia.jpg';

export default function Home() {
  const { data: featuredVehicles, isLoading } = useFeaturedVehicles(6);
  const [introPhase, setIntroPhase] = useState<'video' | 'fading' | 'final'>('video');
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
    // Inicia o vídeo imediatamente
    const playTimer = setTimeout(() => {
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

    return () => clearTimeout(playTimer);
  }, [isMobile]);

  const handleVideoEnd = () => {
    // No mobile, apenas congela no último frame (não faz nada)
    if (isMobile) {
      return;
    }
    // Desktop: faz fade para preto e depois mostra a logo
    setIntroPhase('fading');
    setTimeout(() => {
      setIntroPhase('final');
    }, 1000);
  };

  const handleMobileVideoEnd = () => {
    // Mobile: congela no último frame - pausa o vídeo no final
    if (mobileVideoRef.current) {
      mobileVideoRef.current.pause();
    }
  };

  const openGoogleMaps = () => {
    window.open(
      "https://www.google.com/maps/search/?api=1&query=Av.+Dom+Pedro+I,+7231+-+Loja+03+-+Estoril,+Taubaté+-+SP,+12091-000",
      "_blank"
    );
  };

  return (
    <div className="bg-public-bg text-public-fg">
      {/* Hero Section - Video → Fade to Black → Logo (Desktop) / Freeze on last frame (Mobile) */}
      <section className="relative h-[100dvh] overflow-hidden bg-black">

        {/* Dark overlay on video to make it darker - ONLY DESKTOP */}
        <div 
          className={`absolute inset-0 pointer-events-none z-[5] transition-opacity duration-500 hidden md:block ${
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
            introPhase === 'final' ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ 
            height: '115%', 
            top: '-7.5%',
            objectFit: 'cover',
            objectPosition: 'center top'
          }}
        >
          <source src="/videos/investinicio.mp4" type="video/mp4" />
        </video>

        {/* Video - Mobile - vídeo separado, sem overlay, congela no final */}
        <video
          ref={mobileVideoRef}
          muted
          playsInline
          onEnded={handleMobileVideoEnd}
          className="absolute inset-0 w-full md:hidden"
          style={{ 
            height: '115%', 
            top: '-7.5%',
            objectFit: 'cover',
            objectPosition: 'center top'
          }}
        >
          <source src="/videos/hero-video-mobile.mp4" type="video/mp4" />
        </video>

        {/* Fade to black overlay quando o vídeo termina - ONLY DESKTOP */}
        <motion.div
          className="absolute inset-0 bg-black pointer-events-none z-[15] hidden md:block"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: introPhase === 'fading' || introPhase === 'final' ? 1 : 0 
          }}
          transition={{ duration: 1 }}
        />

        {/* Logo final após fade to black - ONLY DESKTOP */}
        <AnimatePresence>
          {introPhase === 'final' && !isMobile && (
            <motion.div
              className="absolute inset-0 z-20 flex items-center justify-center bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.img
                src={logoImg}
                alt="Invest Veículos"
                className="h-24 sm:h-32 md:h-40 lg:h-48 w-auto object-contain"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
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

      {/* About Section - Quem Somos */}
      <section className="py-16 sm:py-20 md:py-28 bg-public-bg overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <motion.div
                className="relative aspect-square rounded-2xl overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <img 
                  src={lojaNoite} 
                  alt="Invest Veículos - Loja Noite" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </motion.div>
              {/* Floating Badge */}
              <motion.div 
                className="absolute -bottom-4 -right-4 sm:bottom-6 sm:right-6 bg-public-primary text-public-primary-foreground px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="text-2xl sm:text-3xl font-bold">+20</div>
                <div className="text-xs sm:text-sm opacity-90">Anos de Tradição</div>
              </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-public-primary text-xs sm:text-sm font-medium uppercase tracking-widest mb-3 sm:mb-4 block">
                Quem Somos
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-public-fg mb-4 sm:mb-6 leading-tight">
                Excelência em <span className="text-public-primary">Seminovos</span> Premium
              </h2>
              <p className="text-public-fg/70 text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8">
                Há mais de duas décadas, a Invest Veículos é referência no mercado de seminovos premium em Taubaté e região. Nossa missão é oferecer veículos de alta qualidade com total transparência, segurança e o melhor atendimento do Vale do Paraíba.
              </p>
              <p className="text-public-fg/60 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
                Cada veículo passa por rigorosa inspeção técnica e possui laudo cautelar completo, garantindo sua tranquilidade na compra. Trabalhamos com as melhores marcas e modelos, sempre com procedência verificada.
              </p>
              
              {/* Features List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  { icon: FileCheck, text: 'Laudo Cautelar Aprovado' },
                  { icon: Shield, text: 'Procedência Garantida' },
                  { icon: Handshake, text: 'Negociação Transparente' },
                  { icon: HeartHandshake, text: 'Pós-Venda Dedicado' },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3 p-3 sm:p-4 bg-public-surface rounded-xl border border-public-border/50"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-public-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-public-primary" />
                    </div>
                    <span className="text-public-fg text-sm sm:text-base font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Differentials Section - Por que nos escolher */}
      <section className="py-16 sm:py-20 md:py-28 bg-public-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-public-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-public-primary text-xs sm:text-sm font-medium uppercase tracking-widest mb-3 sm:mb-4 block">
              Nossos Diferenciais
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-public-fg leading-tight">
              Por que escolher a <span className="text-public-primary">Invest</span>?
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                icon: Shield,
                title: 'Segurança Total',
                description: 'Todos os veículos possuem laudo cautelar aprovado e documentação verificada. Zero surpresas.',
              },
              {
                icon: Sparkles,
                title: 'Qualidade Premium',
                description: 'Selecionamos apenas os melhores seminovos do mercado, com baixa quilometragem e excelente estado.',
              },
              {
                icon: Clock,
                title: 'Agilidade no Processo',
                description: 'Aprovação de financiamento em minutos. Processos simplificados para você sair de carro novo hoje.',
              },
              {
                icon: Handshake,
                title: 'Negociação Justa',
                description: 'Preços competitivos e transparentes. Avaliamos seu usado na hora com o melhor valor do mercado.',
              },
              {
                icon: HeartHandshake,
                title: 'Pós-Venda Dedicado',
                description: 'Suporte completo após a compra. Estamos aqui para garantir sua satisfação contínua.',
              },
              {
                icon: Award,
                title: '20 Anos de Tradição',
                description: 'Duas décadas construindo relacionamentos de confiança. Nossa reputação é nosso maior patrimônio.',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="group relative p-6 sm:p-8 bg-public-bg rounded-2xl border border-public-border/50 hover:border-public-primary/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-public-primary/0 via-public-primary to-public-primary/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-public-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-public-primary/20 transition-colors">
                  <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-public-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-public-fg mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-public-fg/60 text-sm sm:text-base leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 md:py-28 bg-public-bg">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-public-primary text-xs sm:text-sm font-medium uppercase tracking-widest mb-3 sm:mb-4 block">
              Depoimentos
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-public-fg leading-tight">
              O que nossos <span className="text-public-fg/50">clientes</span> dizem
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {[
              {
                name: 'Carlos Eduardo',
                vehicle: 'Honda Civic 2022',
                text: 'Excelente atendimento! Comprei meu Civic com total transparência. O carro estava impecável e toda documentação em dia. Recomendo a todos.',
                rating: 5,
              },
              {
                name: 'Mariana Santos',
                vehicle: 'Toyota Corolla 2023',
                text: 'Já é o segundo veículo que compro na Invest. Atendimento diferenciado, preço justo e pós-venda nota 10. Voltarei para o próximo!',
                rating: 5,
              },
              {
                name: 'Roberto Almeida',
                vehicle: 'Jeep Compass 2021',
                text: 'Processo de compra muito ágil. Financiamento aprovado na hora e saí com meu Compass no mesmo dia. Profissionais muito competentes.',
                rating: 5,
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="relative p-6 sm:p-8 bg-public-surface rounded-2xl border border-public-border/50"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-public-primary/20 absolute top-4 right-4 sm:top-6 sm:right-6" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-public-primary text-public-primary" />
                  ))}
                </div>
                <p className="text-public-fg/80 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                  "{testimonial.text}"
                </p>
                <div className="border-t border-public-border/50 pt-4">
                  <div className="font-semibold text-public-fg text-sm sm:text-base">{testimonial.name}</div>
                  <div className="text-public-fg/50 text-xs sm:text-sm">{testimonial.vehicle}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section - Nossa Estrutura */}
      <section className="py-16 sm:py-20 md:py-28 bg-public-surface">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-public-primary text-xs sm:text-sm font-medium uppercase tracking-widest mb-3 sm:mb-4 block">
              Nossa Estrutura
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-public-fg leading-tight">
              Conheça nossa <span className="text-public-primary">Loja</span>
            </h2>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="relative overflow-hidden rounded-2xl aspect-video">
              <img 
                src={lojaDia} 
                alt="Invest Veículos - Fachada" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-28 bg-public-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-public-primary/10 via-transparent to-public-primary/10" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-public-primary text-xs sm:text-sm font-medium uppercase tracking-widest mb-3 sm:mb-4 block">
              Pronto para dirigir?
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-public-fg mb-4 sm:mb-6 leading-tight">
              Encontre seu próximo <span className="text-public-primary">veículo</span>
            </h2>
            <p className="text-public-fg/60 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 leading-relaxed">
              Explore nosso estoque completo de seminovos premium. Financiamento facilitado, entrada reduzida e as melhores condições do mercado.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link to="/veiculos">
                <motion.button
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-public-primary text-public-primary-foreground rounded-full font-semibold text-sm sm:text-base hover:bg-public-primary-dark transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Ver Estoque Completo
                </motion.button>
              </Link>
              <motion.a
                href="https://wa.me/5512978984051"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-public-surface border border-public-border text-public-fg rounded-full font-semibold text-sm sm:text-base hover:bg-public-muted hover:border-public-primary/30 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                Fale Conosco
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-12 sm:py-16 md:py-24 bg-public-surface">
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
                      Av. Dom Pedro I, 7231 - Loja 03<br />
                      Estoril - Taubaté/SP<br />
                      CEP: 12091-000
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-public-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-public-primary" />
                  </div>
                  <div>
                    <h3 className="text-public-fg font-semibold text-sm sm:text-base mb-1">Telefone</h3>
                    <p className="text-public-fg/60 text-sm sm:text-base leading-relaxed">
                      (12) 97898-4051
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
                coordinates="Av. Dom Pedro I, 7231 - Loja 03, Estoril, Taubaté - SP"
                className="w-full aspect-[4/3] sm:aspect-square rounded-2xl"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
