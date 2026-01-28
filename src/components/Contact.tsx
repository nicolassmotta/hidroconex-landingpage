import { MapPin, Phone, Clock, Mail } from "lucide-react";

const Contact = () => {
  return (
    <section id="contato" className="section-padding bg-muted/30">
      <div className="section-container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Fale Conosco
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Entre em <span className="text-primary">Contato</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Estamos prontos para atender suas necessidades. Solicite um orçamento 
            ou tire suas dúvidas com nossa equipe.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            {/* Address */}
            <div className="card-industrial p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Endereço</h3>
                <p className="text-muted-foreground">
                  R. Monteiro Lobato, 750<br />
                  Distrito Ind. Campo Verdi<br />
                  São José do Rio Preto - SP
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="card-industrial p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Telefone</h3>
                <a 
                  href="tel:+5517992176868" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  (17) 99217-6868
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="card-industrial p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Horário de Funcionamento</h3>
                <p className="text-muted-foreground">
                  Segunda a Sexta<br />
                  <span className="text-primary font-medium">Aberto até às 17:30</span>
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="card-industrial p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">E-mail</h3>
                <a 
                  href="mailto:contato@hidroconex.com.br" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  contato@hidroconex.com.br
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card-industrial p-8">
            <h3 className="text-xl font-bold text-foreground mb-6">
              Solicite um Orçamento
            </h3>
            <form className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Mensagem
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                  placeholder="Descreva o que você precisa..."
                />
              </div>
              <button
                type="submit"
                className="w-full btn-hero py-4"
              >
                Enviar Solicitação
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
