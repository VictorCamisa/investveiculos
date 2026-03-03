import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, FileCheck, CreditCard, Car, CheckCircle, MapPin, Clock, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationMap } from '@/components/ui/expand-map';
import logoImg from '@/assets/logo-invest-veiculos.png';
import lojaNoite from '@/assets/loja-noite.jpg';
import lojaDia from '@/assets/loja-dia.jpg';
import lojaFachada from '@/assets/loja-fachada-principal.jpg';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function Sobre() {
  const openGoogleMaps = () => {
    window.open(
      "https://www.google.com/maps/search/?api=1&query=Av.+Dom+Pedro+I,+7231+-+Loja+03+-+Estoril,+Taubaté+-+SP,+12091-000",
      "_blank"
    );
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/5512981776577?text=Olá! Gostaria de mais informações.', '_blank');
  };

  return (
    <div className="bg-public-bg text-public-fg overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black z-10" />
          <motion.img 
            src={lojaFachada}
            alt="Invest Veículos"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear" }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-20">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.span 
              className="text-public-primary text-sm font-public-body font-medium uppercase tracking-widest mb-4 block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Conheça nossa história
            </motion.span>
            <motion.h1 
              className="text-6xl md:text-8xl font-public-display text-white tracking-wide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              SOBRE A <span className="text-public-primary">INVEST</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-white/60 font-public-body mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Mais de 20 anos de tradição no Vale do Paraíba
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-24 bg-public-surface relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              className="relative"
              variants={fadeInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="relative rounded-3xl overflow-hidden">
                <img 
                  src={lojaNoite} 
                  alt="Invest Veículos à noite" 
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              <motion.div 
                className="absolute -bottom-6 -right-6 bg-public-surface/90 backdrop-blur-xl border border-public-border rounded-2xl p-6"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-4xl font-public-display text-public-primary">+20</div>
                <div className="text-public-fg/50 text-sm font-public-body">Anos de<br />Experiência</div>
              </motion.div>

              <motion.div 
                className="absolute -top-6 -left-6 bg-public-surface/90 backdrop-blur-xl border border-public-border rounded-2xl p-6"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-4xl font-public-display text-public-primary">100%</div>
                <div className="text-public-fg/50 text-sm font-public-body">Laudo<br />Aprovado</div>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeInRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <span className="text-public-primary text-sm font-public-body font-medium uppercase tracking-widest mb-4 block">
                Nossa História
              </span>
              <h2 className="text-5xl md:text-6xl font-public-display text-public-fg mb-6 leading-none tracking-wide">
                TRADIÇÃO E CONFIANÇA
                <br />
                <span className="text-public-fg/50">NO VALE DO PARAÍBA</span>
              </h2>
              
              <div className="space-y-4 text-public-fg/60 text-lg leading-relaxed font-public-body">
                <p>
                  A Invest Veículos é referência no mercado de seminovos premium em Taubaté, com mais de 20 anos de experiência no setor automotivo do Vale do Paraíba.
                </p>
                <p>
                  Ao longo dessa trajetória, construímos uma reputação sólida baseada em confiança, transparência e qualidade — valores que permeiam cada negociação realizada em nossa loja.
                </p>
                <p>
                  Nossa missão é clara: oferecer veículos seminovos de procedência verificada, com histórico confiável e total segurança para quem compra. Todos os nossos carros passam por avaliação criteriosa e contam com laudo cautelar 100% aprovado.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Atendimento */}
      <section className="py-24 bg-public-bg relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-16"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="text-public-primary text-sm font-public-body font-medium uppercase tracking-widest mb-4 block">
              Nosso Compromisso
            </span>
            <h2 className="text-5xl md:text-6xl font-public-display text-public-fg tracking-wide">
              ATENDIMENTO TRANSPARENTE
              <br />
              <span className="text-public-fg/50">E NEGOCIAÇÃO SEGURA</span>
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-6 font-public-body"
              variants={fadeInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <p className="text-public-fg/60 text-lg leading-relaxed">
                Na Invest Veículos, acreditamos que comprar um carro deve ser uma experiência simples e sem dores de cabeça. Oferecemos atendimento personalizado, rápido e direto.
              </p>
              <p className="text-public-fg/60 text-lg leading-relaxed">
                Nossa equipe está preparada para orientar você em todas as etapas do processo, esclarecendo dúvidas e apresentando as melhores opções do mercado.
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-2 gap-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                { icon: CreditCard, title: 'Financiamento Bancário', desc: 'Aprovação rápida com as melhores taxas' },
                { icon: CreditCard, title: 'Cartão de Crédito', desc: 'Flexibilidade no pagamento' },
                { icon: Car, title: 'Troca de Veículos', desc: 'Aceitamos carro ou moto como parte' },
                { icon: FileCheck, title: 'Documentação na Hora', desc: 'Entrega imediata dos documentos' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="group p-6 bg-public-surface border border-public-border rounded-2xl hover:border-public-primary/30 transition-all duration-300"
                  whileHover={{ y: -5 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-public-primary/10 border border-public-primary/20 flex items-center justify-center mb-4 group-hover:bg-public-primary group-hover:border-public-primary transition-all">
                    <item.icon className="w-6 h-6 text-public-primary group-hover:text-public-primary-foreground transition-colors" />
                  </div>
                  <h3 className="text-public-fg font-public-body font-semibold mb-2">{item.title}</h3>
                  <p className="text-public-fg/50 text-sm font-public-body">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Garantia de Procedência */}
      <section className="py-24 bg-public-surface relative">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              variants={fadeInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <span className="text-public-primary text-sm font-public-body font-medium uppercase tracking-widest mb-4 block">
                Qualidade Garantida
              </span>
              <h2 className="text-5xl md:text-6xl font-public-display text-public-fg mb-6 tracking-wide leading-none">
                SEMINOVOS REVISADOS
                <br />
                <span className="text-public-fg/50">GARANTIA DE PROCEDÊNCIA</span>
              </h2>
              
              <div className="space-y-4 text-public-fg/60 text-lg leading-relaxed font-public-body mb-8">
                <p>
                  Cada veículo disponível em nosso estoque é selecionado com rigor. Antes de chegar até você, passa por revisão técnica, análise documental e verificação completa de procedência.
                </p>
              </div>

              <motion.div 
                className="space-y-4"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  'Revisão Técnica Completa',
                  'Análise Documental Detalhada',
                  'Verificação de Procedência',
                  'Laudo Cautelar 100% Aprovado',
                ].map((item, i) => (
                  <motion.div key={i} className="flex items-center gap-3" variants={staggerItem}>
                    <div className="w-8 h-8 rounded-full bg-public-primary/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-public-primary" />
                    </div>
                    <span className="text-public-fg font-public-body font-medium">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              className="relative"
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="relative bg-public-muted backdrop-blur-xl border border-public-border rounded-3xl p-10 overflow-hidden">
                <img src={logoImg} alt="Invest Veículos" className="h-12 mb-8" />
                
                <blockquote className="text-2xl text-public-fg/80 font-public-body font-light italic leading-relaxed mb-6">
                  "Mais do que vender carros, nosso compromisso é construir relacionamentos duradouros, baseados na honestidade e na confiança."
                </blockquote>

                <div className="flex items-center gap-2">
                  <motion.div 
                    className="w-10 h-0.5 bg-public-primary"
                    initial={{ width: 0 }}
                    whileInView={{ width: 40 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                  />
                  <span className="text-public-primary font-public-body font-medium">Equipe Invest Veículos</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Visite Nossa Loja */}
      <section className="py-24 bg-public-bg relative">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-16"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="text-public-primary text-sm font-public-body font-medium uppercase tracking-widest mb-4 block">
              Venha nos visitar
            </span>
            <h2 className="text-5xl md:text-6xl font-public-display text-public-fg tracking-wide">
              VISITE A INVEST
              <br />
              <span className="text-public-fg/50">EM TAUBATÉ</span>
            </h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              variants={fadeInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <p className="text-public-fg/60 text-lg leading-relaxed font-public-body mb-8">
                Se você busca comprar, vender ou trocar seu carro em Taubaté, venha conhecer a Invest Veículos. Nossa loja está localizada em um ponto de fácil acesso, pronta para receber você.
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-public-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-public-primary" />
                  </div>
                  <div>
                    <h3 className="font-public-body font-semibold text-public-fg mb-1">Endereço</h3>
                    <p className="text-public-fg/60 font-public-body">
                      Av. Dom Pedro I, 7231 - Loja 03<br />
                      Estoril - Taubaté/SP
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-public-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-public-primary" />
                  </div>
                  <div>
                    <h3 className="font-public-body font-semibold text-public-fg mb-1">Horário</h3>
                    <p className="text-public-fg/60 font-public-body">
                      Seg a Sex: 08h às 18h<br />
                      Sábado: 08h às 13h
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={openGoogleMaps}
                  className="bg-public-primary hover:bg-public-primary-dark text-public-primary-foreground font-public-body font-bold px-6"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Como Chegar
                </Button>
                <Button
                  onClick={openWhatsApp}
                  variant="outline"
                  className="border-public-border text-public-fg hover:bg-public-surface font-public-body font-bold px-6"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Fale Conosco
                </Button>
              </div>
            </motion.div>

            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <div className="rounded-2xl overflow-hidden border border-public-border h-[400px]">
                <LocationMap />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-public-primary to-public-primary-dark">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-public-display text-white mb-6 tracking-wide">
              PRONTO PARA DIRIGIR?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto font-public-body">
              Explore nosso estoque de seminovos premium e encontre o carro dos seus sonhos.
            </p>
            <Link to="/veiculos">
              <Button 
                size="lg"
                className="bg-white text-public-primary hover:bg-white/90 font-public-body font-bold px-10 py-6 text-lg"
              >
                Ver Estoque
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
