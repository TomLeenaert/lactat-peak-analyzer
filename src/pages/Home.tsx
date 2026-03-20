import { useNavigate } from 'react-router-dom';
import { Zap, FlaskConical, ArrowRight, Clock, BarChart3, Target } from 'lucide-react';

const testTypes = [
  {
    id: 'quick',
    icon: Zap,
    title: 'Veldtest',
    subtitle: 'Compact protocol',
    desc: 'Kort protocol met 3–5 stappen. Ideaal voor tussentijdse monitoring tijdens een trainingsblok.',
    details: [
      { icon: BarChart3, text: '3–5 stappen' },
      { icon: Clock, text: '3 min per stap' },
      { icon: Target, text: '~20 min totaal' },
    ],
    gradient: 'from-amber-500/5 via-orange-500/5 to-rose-500/5',
    border: 'border-amber-400/30 hover:border-amber-400/60',
    iconGradient: 'from-amber-500 to-orange-500',
    badgeColor: 'bg-amber-500/10 text-amber-700',
    delay: 'animation-delay-100',
  },
  {
    id: 'full',
    icon: FlaskConical,
    title: 'Volledige inspanningstest',
    subtitle: 'Uitgebreid protocol',
    desc: 'Volledig protocol met 6–10 stappen + optionele all-out. Voor nauwkeurige drempelbepaling.',
    details: [
      { icon: BarChart3, text: '6–10 stappen' },
      { icon: Clock, text: '5 min per stap' },
      { icon: Target, text: 'All-out + analyse (~45 min)' },
    ],
    gradient: 'from-primary/5 via-accent/5 to-teal-500/5',
    border: 'border-primary/30 hover:border-primary/60',
    iconGradient: 'from-primary to-accent',
    badgeColor: 'bg-primary/10 text-primary',
    delay: 'animation-delay-200',
  },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-3xl space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
              <FlaskConical className="h-4 w-4" />
              Lactaat Analyse Platform
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Welk protocol wil je
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> uitvoeren</span>?
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Kies je testtype en start direct met meten
            </p>
          </div>

          {/* Cards */}
          <div className="grid gap-6 sm:grid-cols-2">
            {testTypes.map((t, index) => (
              <button
                key={t.id}
                onClick={() => navigate(`/test/${t.id}`)}
                className={`group relative text-left rounded-2xl border-2 bg-gradient-to-br ${t.gradient} ${t.border} p-1 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 animate-fade-in`}
                style={{ animationDelay: `${(index + 1) * 150}ms`, animationFillMode: 'both' }}
              >
                <div className="rounded-xl bg-card/80 backdrop-blur-sm p-6 h-full space-y-5">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.iconGradient} flex items-center justify-center shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform duration-300`}>
                    <t.icon className="h-7 w-7 text-primary-foreground" />
                  </div>

                  {/* Title */}
                  <div>
                    <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {t.title}
                    </h2>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${t.badgeColor}`}>
                      {t.subtitle}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>

                  {/* Details */}
                  <div className="space-y-2.5 pt-2 border-t border-border/50">
                    {t.details.map((d, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <d.icon className="h-4 w-4 text-primary/60 shrink-0" />
                        {d.text}
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary pt-2 group-hover:gap-3 transition-all">
                    Start test
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
