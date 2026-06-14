import { MapPin, Phone, Clock, Mail } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import Reveal from "@/components/Reveal";
import { useStoredProducts } from "@/hooks/useStoredProducts";
import { appendQuoteRequest, createEntityId, updateQuoteRequestStatus } from "@/lib/localData";
import {
  sanitizeEmail,
  sanitizeEntityId,
  sanitizeMultilineText,
  sanitizePhone,
  sanitizePlainText,
} from "@/lib/security";

const horariosAgrupados = [
  { dia: "Segunda a Quinta", horas: "07:30 ás 11:30 | 12:42 ás 17:00" },
  { dia: "Sexta-feira", horas: "07:30 ás 11:30 | 12:42 ás 16:00" },
  { dia: "Sábado e Domingo", horas: "Fechado" },
];

const Contact = () => {
  const products = useStoredProducts();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === "ativo"),
    [products],
  );

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      // Convert current time to Brasilia timezone (prevents bugs if user is in another country)
      const brTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
      const day = brTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday

      // Convert current time in total minutes for easy comparison (ex: 07:30 = 7 * 60 + 30 = 450)
      const timeInMinutes = brTime.getHours() * 60 + brTime.getMinutes();

      let open = false;

      // Operating rules: Monday to Friday
      if (day >= 1 && day <= 5) {
        // Morning Period: 07:30 (450 min) to 11:30 (690 min)
        const isMorningOpen = timeInMinutes >= 450 && timeInMinutes < 690;

        // Afternoon Period: 12:42 (762 min) to 17:00 (1020 min) for Mon-Thu, or 16:00 (960 min) for Friday
        const afternoonClose = day === 5 ? 960 : 1020;
        const isAfternoonOpen = timeInMinutes >= 762 && timeInMinutes < afternoonClose;

        if (isMorningOpen || isAfternoonOpen) {
          open = true;
        }
      }

      setIsOpen(open);
    };

    checkStatus();
    // Update status every 60 seconds to reflect real-time changes without reloading the page
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="contato" className="section-padding bg-muted/30">
      <div className="section-container">
        {/* Section Header */}
        <Reveal className="text-center mb-16">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Fale Conosco
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Entre em <span className="text-primary">Contato</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Estamos prontos para atender suas necessidades. Solicite um orçamento
            ou tire suas dúvidas.
          </p>
        </Reveal>

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
                  href="https://wa.me/5517997726171?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20Hidroconex!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  (17) 99772-6171
                </a>
              </div>
            </div>

            {/* Business Hours Card */}
            <div className="card-industrial p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-4">Horário de Funcionamento</h3>

                <div className="space-y-3 w-full text-sm">
                  {horariosAgrupados.map((item, index) => (
                    <div key={index} className="flex items-center group">
                      {/* Day Name */}
                      <span className="text-muted-foreground whitespace-nowrap">
                        {item.dia}
                      </span>

                      {/* Subtle guide line (optional, but helps visually) */}
                      <div className="mx-2 flex-grow border-b border-dotted border-muted/30 mb-1"></div>

                      {/* Hours */}
                      <span className={`
              whitespace-nowrap font-medium
              ${item.horas === "Fechado" ? "text-muted-foreground/60 italic" : "text-foreground"}
            `}>
                        {item.horas}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Real-time Status Indicator */}
                {isOpen ? (
                  <div className="mt-4 pt-4 border-t border-muted/20 flex items-center gap-2 animate-fade-in">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-medium text-green-600 uppercase tracking-wider">Aberto Agora</span>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-muted/20 flex items-center gap-2 animate-fade-in">
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500/80"></span>
                    </span>
                    <span className="text-xs font-medium text-red-600/80 uppercase tracking-wider">Fechado no Momento</span>
                  </div>
                )}
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
                  href="mailto:hidroconex@terra.com.br"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  hidroconex@terra.com.br
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card-industrial p-6 sm:p-8 relative">
            <h3 className="text-xl font-bold text-foreground mb-6">
              Solicite um Orçamento
            </h3>

            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                setSubmitStatus(null);
                
                if (!captchaToken) {
                  setSubmitStatus({ type: 'error', message: 'Por favor, preencha o captcha antes de enviar.' });
                  setIsSubmitting(false);
                  return;
                }

                // Prepare form data as JSON
                const formData = new FormData(e.currentTarget);
                const objectData = Object.fromEntries(formData);
                const submittedProductId = sanitizeEntityId(objectData.productId);
                const safeName = sanitizePlainText(objectData.name, 100);
                const safeEmail = sanitizeEmail(objectData.email);
                const safePhone = sanitizePhone(objectData.phone);
                const safeMessage = sanitizeMultilineText(objectData.message, 800);
                const selectedProduct = activeProducts.find((product) => product.id === submittedProductId);
                const selectedProductId = selectedProduct?.id || "";

                if (!safeName || !safePhone || !safeMessage) {
                  setSubmitStatus({ type: 'error', message: 'Confira nome, telefone e mensagem antes de enviar.' });
                  setIsSubmitting(false);
                  return;
                }

                const requestId = createEntityId("orcamento");

                appendQuoteRequest({
                  id: requestId,
                  name: safeName,
                  email: safeEmail,
                  phone: safePhone,
                  productId: selectedProductId,
                  productModel: selectedProduct?.model || "Produto não informado",
                  message: safeMessage,
                  status: "novo",
                  createdAt: new Date().toISOString(),
                });

                objectData.name = safeName;
                objectData.email = safeEmail;
                objectData.phone = safePhone;
                objectData.productId = selectedProductId;
                objectData.message = safeMessage;
                objectData.access_key = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || "";
                objectData["h-captcha-response"] = captchaToken;
                objectData.subject = "Nova solicitação de orçamento pelo site Hidroconex";
                objectData.product = selectedProduct?.model || "Produto não informado";
                const json = JSON.stringify(objectData);

                try {
                  const res = await fetch("https://api.web3forms.com/submit", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Accept: "application/json",
                    },
                    body: json
                  });

                  const data = await res.json();
                  console.log("Web3Forms Response:", data);

                  if (data.success) {
                    updateQuoteRequestStatus(requestId, "enviado");
                    setSubmitStatus({ type: 'success', message: 'Sua solicitação foi enviada com sucesso! Entraremos em contato em breve.' });
                    (e.target as HTMLFormElement).reset();
                    setCaptchaToken(null);
                    captchaRef.current?.resetCaptcha();
                  } else {
                    updateQuoteRequestStatus(requestId, "erro");
                    console.error("Web3Forms Error:", data);
                    setSubmitStatus({ type: 'error', message: data.message || 'Ocorreu um erro ao enviar. Por favor, tente novamente ou contate-nos por WhatsApp.' });
                  }
                } catch (error) {
                  updateQuoteRequestStatus(requestId, "erro");
                  console.error("Network Error:", error);
                  setSubmitStatus({ type: 'error', message: 'Erro de conexão. Verifique sua internet e tente novamente.' });
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  maxLength={100}
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Seu nome"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  maxLength={120}
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="seu@email.com"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  maxLength={30}
                  autoComplete="tel"
                  className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="(00) 00000-0000"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="productId" className="block text-sm font-medium text-foreground mb-2">
                  Produto de Interesse
                </label>
                <select
                  id="productId"
                  name="productId"
                  className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  disabled={isSubmitting}
                >
                  <option value="">Selecione um produto, se desejar</option>
                  {activeProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.model} | {product.subCategory}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Mensagem
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  maxLength={800}
                  rows={4}
                  className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                  placeholder="Descreva o que você precisa..."
                  disabled={isSubmitting}
                />
              </div>

              {submitStatus && (
                <div className={`p-4 rounded-md text-sm font-medium animate-fade-in ${submitStatus.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                  {submitStatus.message}
                </div>
              )}

              {/* Wrapper keeps the ~300px widget from overflowing narrow cards */}
              <div className="flex justify-center">
                <div className="origin-center scale-90 sm:scale-100">
                  <HCaptcha
                    ref={captchaRef}
                    sitekey="50b2fe65-b00b-4b9e-ad62-3ba471098be2"
                    reCaptchaCompat={false}
                    onVerify={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-hero py-4 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Enviando...
                  </>
                ) : (
                  "Enviar Solicitação"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
