import { CircleDot, Circle, Hexagon, SquareStack, Link2 } from "lucide-react";

const products = [
  {
    icon: CircleDot,
    title: "Luvas de Aço",
    description: "Luvas de aço carbono e inox para conexões de alta pressão, com acabamento de precisão.",
  },
  {
    icon: Hexagon,
    title: "Flanges",
    description: "Flanges industriais em diversos diâmetros e especificações, ideais para tubulações.",
  },
  {
    icon: Circle,
    title: "Plugs",
    description: "Plugs de vedação em aço carbono e inox, com rosca NPT e BSP para sistemas pressurizados.",
  },
  {
    icon: SquareStack,
    title: "Juntas de Borracha",
    description: "Juntas de borracha industrial para vedação, disponíveis em diversos materiais e dimensões.",
  },
  {
    icon: Link2,
    title: "Conexões em Geral",
    description: "Ampla linha de conexões industriais: niples, cotovelos, tês, reduções e mais.",
  },
];

const Products = () => {
  return (
    <section id="produtos" className="section-padding bg-muted/30">
      <div className="section-container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Nossa Linha
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nossos <span className="text-primary">Produtos</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Fabricamos componentes industriais de alta qualidade para atender 
            às mais exigentes demandas do setor.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product, index) => (
            <div
              key={product.title}
              className="card-industrial p-8 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <product.icon className="w-8 h-8 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                {product.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Hover Accent */}
              <div className="mt-6 flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm">Saiba mais</span>
                <svg
                  className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="#contato"
            className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-semibold px-8 py-4 rounded-md hover:bg-secondary/90 transition-colors"
          >
            Solicitar Catálogo Completo
          </a>
        </div>
      </div>
    </section>
  );
};

export default Products;
