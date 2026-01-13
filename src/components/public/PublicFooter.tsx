import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram, Facebook, MessageCircle } from 'lucide-react';
import logoImg from '@/assets/logo-invest-veiculos.png';

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-public-fg">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-10 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <img 
              src={logoImg} 
              alt="Invest Veículos" 
              className="h-10 sm:h-12 md:h-14 w-auto mb-4 sm:mb-6"
            />
            <p className="text-public-fg/60 text-xs sm:text-sm leading-relaxed">
              Sua loja de veículos seminovos em excelente estado. Qualidade e confiança há mais de 20 anos no mercado.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4 md:mb-6">Navegação</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link to="/" className="text-xs sm:text-sm text-public-fg/60 hover:text-public-primary transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/veiculos" className="text-xs sm:text-sm text-public-fg/60 hover:text-public-primary transition-colors">
                  Veículos
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4 md:mb-6">Contato</h4>
            <ul className="space-y-3 sm:space-y-4">
              <li className="flex items-start gap-2 sm:gap-3">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-public-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-public-fg/60 text-xs sm:text-sm">(12) 3621-3025</p>
                  <p className="text-public-fg/60 text-xs sm:text-sm">(12) 99765-5893</p>
                </div>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-public-primary flex-shrink-0 mt-0.5" />
                <p className="text-public-fg/60 text-xs sm:text-sm break-all">contato@investveiculos.com.br</p>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-public-primary flex-shrink-0 mt-0.5" />
                <p className="text-public-fg/60 text-xs sm:text-sm">
                  Av. Maj. Joaquim Monteiro Patto, 25<br />
                  Chácara do Visconde - Taubaté/SP
                </p>
              </li>
            </ul>
          </div>

          {/* Social & Employee access */}
          <div>
            <h4 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4 md:mb-6">Redes Sociais</h4>
            <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
              <a 
                href="#" 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-public-muted rounded-full flex items-center justify-center hover:bg-public-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-public-muted rounded-full flex items-center justify-center hover:bg-public-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-public-muted rounded-full flex items-center justify-center hover:bg-public-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>

            <Link 
              to="/auth" 
              className="text-public-fg/40 text-xs sm:text-sm hover:text-public-fg/60 transition-colors"
            >
              Acesso Funcionário →
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-public-border">
        <div className="container mx-auto px-4 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <p className="text-public-fg/40 text-xs sm:text-sm text-center sm:text-left">
            © {currentYear} Invest Veículos. Todos os direitos reservados.
          </p>
          <p className="text-public-fg/30 text-[10px] sm:text-xs">
            Desenvolvido com ❤️
          </p>
        </div>
      </div>
    </footer>
  );
}
