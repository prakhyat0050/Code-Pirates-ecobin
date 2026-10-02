import { Globe, Smartphone, BadgeCheck, LineChart, Sparkles } from 'lucide-react';

const futureFeatures = [
  {
    icon: Smartphone,
    title: 'Native Mobile App',
    description: 'An installable iOS & Android app with offline support, so you can classify waste even without a signal.',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    icon: Globe,
    title: 'Multilingual Support',
    description: 'Disposal guidance in Hindi and regional languages, so EcoBin works for every household across India.',
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
  },
  {
    icon: BadgeCheck,
    title: 'Verified Centre Directory',
    description: 'A curated, verified database of recycling and e-waste centres with hours and accepted materials — beyond a map search.',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    icon: LineChart,
    title: 'City-Level Impact Analytics',
    description: 'Aggregate, anonymised dashboards for municipalities to see sorting trends and target awareness campaigns.',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
];

export default function FutureScope() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium mb-4">
          <Sparkles />
          What's Coming Next
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
          The Future of EcoBin
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          AI classification, photo scanning, India-specific rules, and the community leaderboard are already live.
          Here's what we're building next.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {futureFeatures.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div
              key={i}
              className={`group relative overflow-hidden bg-white rounded-2xl border ${feature.borderColor} p-6 hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
              <div className={`absolute -bottom-8 -right-8 w-24 h-24 rounded-full ${feature.bgColor} opacity-50 group-hover:scale-150 transition-transform duration-500`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}