import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LocationMap } from '@/components/ui/expand-map';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Contato() {
  const openWhatsApp = () => {
    window.open('https://wa.me/5512981776577?text=Olá! Gostaria de mais informações sobre os veículos.', '_blank');
  };

  const openGoogleMaps = () => {
    window.open(
      'https://www.google.com/maps/search/?api=1&query=Av.+Dom+Pedro+I,+7231+-+Loja+03+-+Estoril,+Taubaté+-+SP,+12091-000',
      '_blank'
    );
  };

  return (
    <div className="bg-public-bg min-h-screen pt-24">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-public-surface via-public-muted to-public-surface py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl md:text-7xl font-public-display text-public-fg mb-4 tracking-wide">
              ENTRE EM <span className="text-public-primary">CONTATO</span>
            </h1>
            <p className="text-public-fg/60 text-lg font-public-body">
              Estamos prontos para atendê-lo. Visite nossa loja ou entre em contato pelos nossos canais.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 -mt-8">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid md:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div
              className="bg-public-surface p-6 rounded-xl border border-public-border hover:border-public-primary/50 transition-all duration-300 group"
              variants={fadeInUp}
            >
              <div className="w-14 h-14 bg-public-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-public-primary/20 transition-colors">
                <Phone className="h-6 w-6 text-public-primary" />
              </div>
              <h3 className="font-public-body font-bold text-public-fg mb-2 text-lg">TELEFONE</h3>
              <p className="text-public-fg/60 text-sm font-public-body">(12) 98177-6577</p>
            </motion.div>

            <motion.div
              className="bg-public-surface p-6 rounded-xl border border-public-border hover:border-green-500/50 transition-all duration-300 group cursor-pointer"
              variants={fadeInUp}
              onClick={openWhatsApp}
            >
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                <MessageCircle className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-public-body font-bold text-public-fg mb-2 text-lg">WHATSAPP</h3>
              <p className="text-public-fg/60 text-sm font-public-body">(12) 98177-6577</p>
              <p className="text-green-500 text-sm font-public-body font-medium mt-1">Clique para conversar →</p>
            </motion.div>

            <motion.div
              className="bg-public-surface p-6 rounded-xl border border-public-border hover:border-public-primary/50 transition-all duration-300 group"
              variants={fadeInUp}
            >
              <div className="w-14 h-14 bg-public-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-public-primary/20 transition-colors">
                <Mail className="h-6 w-6 text-public-primary" />
              </div>
              <h3 className="font-public-body font-bold text-public-fg mb-2 text-lg">E-MAIL</h3>
              <p className="text-public-fg/60 text-sm font-public-body break-all">contato@investveiculos.com.br</p>
            </motion.div>

            <motion.div
              className="bg-public-surface p-6 rounded-xl border border-public-border hover:border-public-primary/50 transition-all duration-300 group"
              variants={fadeInUp}
            >
              <div className="w-14 h-14 bg-public-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-public-primary/20 transition-colors">
                <Clock className="h-6 w-6 text-public-primary" />
              </div>
              <h3 className="font-public-body font-bold text-public-fg mb-2 text-lg">HORÁRIO</h3>
              <p className="text-public-fg/60 text-sm font-public-body">Seg a Sex: 08h às 18h</p>
              <p className="text-public-fg/60 text-sm font-public-body">Sábado: 08h às 13h</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Location & Map */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-4xl md:text-5xl font-public-display text-public-fg mb-6 tracking-wide">
                NOSSA <span className="text-public-primary">LOCALIZAÇÃO</span>
              </h2>
              
              <div className="bg-public-surface p-6 rounded-xl border border-public-border mb-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-public-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-public-primary" />
                  </div>
                  <div>
                    <h3 className="font-public-body font-semibold text-public-fg mb-1">Endereço</h3>
                    <p className="text-public-fg/60 font-public-body">
                      Av. Dom Pedro I, 7231 - Loja 03<br />
                      Estoril - Taubaté/SP, CEP 12091-000
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={openGoogleMaps}
                  className="w-full bg-public-primary hover:bg-public-primary-dark text-public-primary-foreground font-public-body font-bold"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Ver no Google Maps
                </Button>
              </div>

              <div className="rounded-xl overflow-hidden border border-public-border h-[300px]">
                <LocationMap />
              </div>

              <div className="mt-8">
                <h3 className="text-2xl font-public-display text-public-fg mb-4 tracking-wide">REDES SOCIAIS</h3>
                <div className="flex gap-4">
                  <a 
                    href="https://instagram.com/investveiculos" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-public-surface border border-public-border rounded-xl flex items-center justify-center hover:bg-public-primary hover:border-public-primary transition-all duration-300 group"
                  >
                    <Instagram className="h-5 w-5 text-public-fg/60 group-hover:text-public-primary-foreground" />
                  </a>
                  <a 
                    href="https://facebook.com/investveiculos" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-public-surface border border-public-border rounded-xl flex items-center justify-center hover:bg-public-primary hover:border-public-primary transition-all duration-300 group"
                  >
                    <Facebook className="h-5 w-5 text-public-fg/60 group-hover:text-public-primary-foreground" />
                  </a>
                  <button 
                    onClick={openWhatsApp}
                    className="w-12 h-12 bg-public-surface border border-public-border rounded-xl flex items-center justify-center hover:bg-green-500 hover:border-green-500 transition-all duration-300 group"
                  >
                    <MessageCircle className="h-5 w-5 text-public-fg/60 group-hover:text-public-primary-foreground" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-4xl md:text-5xl font-public-display text-public-fg mb-6 tracking-wide">
                ENVIE UMA <span className="text-public-primary">MENSAGEM</span>
              </h2>

              <div className="bg-public-surface p-8 rounded-xl border border-public-border">
                <form className="space-y-5">
                  <div>
                    <label className="block text-sm font-public-body font-medium text-public-fg mb-2">Nome completo</label>
                    <Input 
                      placeholder="Seu nome" 
                      className="bg-public-bg border-public-border focus:border-public-primary"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-public-body font-medium text-public-fg mb-2">E-mail</label>
                      <Input 
                        placeholder="seu@email.com" 
                        type="email" 
                        className="bg-public-bg border-public-border focus:border-public-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-public-body font-medium text-public-fg mb-2">Telefone</label>
                      <Input 
                        placeholder="(12) 99999-9999" 
                        className="bg-public-bg border-public-border focus:border-public-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-public-body font-medium text-public-fg mb-2">Assunto</label>
                    <Input 
                      placeholder="Sobre qual veículo deseja saber?" 
                      className="bg-public-bg border-public-border focus:border-public-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-public-body font-medium text-public-fg mb-2">Mensagem</label>
                    <Textarea 
                      placeholder="Escreva sua mensagem aqui..." 
                      rows={5} 
                      className="bg-public-bg border-public-border focus:border-public-primary resize-none"
                    />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-public-primary hover:bg-public-primary-dark text-public-primary-foreground py-6 text-lg font-public-body font-bold"
                  >
                    Enviar Mensagem
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-public-border">
                  <p className="text-center text-public-fg/60 text-sm font-public-body mb-4">
                    Prefere um atendimento mais rápido?
                  </p>
                  <Button 
                    onClick={openWhatsApp}
                    variant="outline"
                    className="w-full border-green-500 text-green-500 hover:bg-green-500 hover:text-white py-5 font-public-body"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Chamar no WhatsApp
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-public-primary to-public-primary-dark">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-public-display text-white mb-4 tracking-wide">
              VENHA NOS VISITAR!
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto font-public-body">
              Nossa equipe está pronta para encontrar o veículo ideal para você. 
              Venha conhecer nosso estoque e fazer o melhor negócio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={openGoogleMaps}
                size="lg"
                className="bg-white text-public-primary hover:bg-white/90 font-public-body font-bold px-8"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Como Chegar
              </Button>
              <Button 
                onClick={openWhatsApp}
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 font-public-body font-bold px-8"
              >
                <Phone className="h-5 w-5 mr-2" />
                Ligar Agora
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
