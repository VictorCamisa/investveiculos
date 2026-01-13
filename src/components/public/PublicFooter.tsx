import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Instagram, Facebook, MessageCircle } from 'lucide-react';
import logoImg from '@/assets/logo-invest-veiculos.png';

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-public-surface text-public-fg">
      {/* Main footer content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <img 
              src={logoImg} 
              alt="Matheus Veículos" 
              className="h-14 w-auto mb-6"
            />
            <p className="text-public-fg/60 text-sm leading-relaxed">
              Sua loja de veículos seminovos em excelente estado. Qualidade e confiança há mais de 10 anos no mercado.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Navegação</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-public-fg/60 hover:text-public-primary transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link to="/veiculos" className="text-public-fg/60 hover:text-public-primary transition-colors">
                  Veículos
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contato</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-public-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-public-fg/60 text-sm">(11) 4654-1785</p>
                  <p className="text-public-fg/60 text-sm">(11) 97306-8654</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-public-primary flex-shrink-0 mt-0.5" />
                <p className="text-public-fg/60 text-sm">contato@matheusveiculos.com.br</p>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-public-primary flex-shrink-0 mt-0.5" />
                <p className="text-public-fg/60 text-sm">
                  Rua Benedito de Oliveira Cavalheiro, 125<br />
                  Arujá - SP, 07402-060
                </p>
              </li>
            </ul>
          </div>

          {/* Social & Employee access */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Redes Sociais</h4>
            <div className="flex gap-4 mb-8">
              <a 
                href="#" 
                className="w-10 h-10 bg-public-muted rounded-full flex items-center justify-center hover:bg-public-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-public-muted rounded-full flex items-center justify-center hover:bg-public-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-public-muted rounded-full flex items-center justify-center hover:bg-public-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>

            <Link 
              to="/auth" 
              className="text-public-fg/40 text-sm hover:text-public-fg/60 transition-colors"
            >
              Acesso Funcionário →
            </Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-public-border">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-public-fg/40 text-sm">
            © {currentYear} Invest Veículos. Todos os direitos reservados.
          </p>
          <p className="text-public-fg/30 text-xs">
            Desenvolvido com ❤️
          </p>
        </div>
      </div>
    </footer>
  );
}
