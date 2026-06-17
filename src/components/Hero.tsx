import { ArrowRight, Cog, Award, Users } from "lucide-react";
import heroImage from "@/assets/AI/hero-industrial.jpg";

const Hero = () => {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      <div className="relative z-10 section-container py-32 md:py-40">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-2 mb-8 animate-fade-in">
            <Cog className="w-4 h-4 text-primary" />
            <span className="text-primary font-medium text-sm">
              Fabricação industrial de alta precisão
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-foreground leading-tight mb-6 animate-fade-in-up">
            Especialistas em{" "}
            <span className="text-primary">conexões</span> e{" "}
            <span className="text-primary">componentes de aço</span>
          </h1>

          <p className="text-lg md:text-xl text-secondary-foreground/80 mb-10 max-w-2xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Fabricação com precisão e qualidade para o setor industrial.
            Soluções para reservatórios, tanques e aplicações sob medida em
            São José do Rio Preto e região.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <a
              href="#contato"
              className="btn-hero inline-flex items-center justify-center gap-2 group"
            >
              Solicitar orçamento
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/catalogo"
              className="btn-secondary-hero inline-flex items-center justify-center gap-2"
            >
              Ver catálogo
            </a>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            <div className="flex items-center gap-3 text-secondary-foreground/80">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-secondary-foreground">14 anos de fábrica</p>
                <p className="text-sm text-secondary-foreground/60">Experiência comprovada</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-secondary-foreground/80">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Cog className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-secondary-foreground">Fabricação própria</p>
                <p className="text-sm text-secondary-foreground/60">Controle de qualidade</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-secondary-foreground/80">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-secondary-foreground">+150 clientes</p>
                <p className="text-sm text-secondary-foreground/60">Atendidos na região</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
