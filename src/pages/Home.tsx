import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, FlaskConical } from 'lucide-react';

const testTypes = [
  {
    id: 'quick',
    icon: Zap,
    title: 'Veldtest',
    subtitle: 'Compact protocol',
    desc: 'Kort protocol met 3–5 stappen. Ideaal voor tussentijdse monitoring tijdens een trainingsblok.',
    details: ['3–5 stappen', '3 min per stap', 'Snelle afname (~20 min)'],
    accent: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    iconBg: 'bg-amber-500/15',
  },
  {
    id: 'full',
    icon: FlaskConical,
    title: 'Volledige inspanningstest',
    subtitle: 'Uitgebreid protocol',
    desc: 'Volledig protocol met 6–10 stappen + optionele all-out. Voor nauwkeurige drempelbepaling.',
    details: ['6–10 stappen', '5 min per stap', 'All-out optie', 'Uitgebreide analyse (~45 min)'],
    accent: 'bg-primary/10 text-primary border-primary/20',
    iconBg: 'bg-primary/15',
  },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">🔬 Lactaat Test Tool</h1>
            <p className="text-muted-foreground text-lg">Kies het type test dat je wilt uitvoeren</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {testTypes.map((t) => (
              <Card
                key={t.id}
                className={`cursor-pointer border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${t.accent}`}
                onClick={() => navigate(`/test/${t.id}`)}
              >
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-xl ${t.iconBg} flex items-center justify-center`}>
                    <t.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{t.title}</h2>
                    <p className="text-sm font-medium opacity-75">{t.subtitle}</p>
                  </div>
                  <p className="text-sm opacity-80">{t.desc}</p>
                  <ul className="space-y-1">
                    {t.details.map((d, i) => (
                      <li key={i} className="text-xs opacity-70 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
