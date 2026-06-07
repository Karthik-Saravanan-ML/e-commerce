import {
  BookOpen, Library, Baby, GraduationCap, User, FlaskConical,
  Landmark, Sparkles, Heart, Search, Wand2, Package,
} from 'lucide-react';

const ICON_MAP = {
  fiction: BookOpen,
  'non-fiction': Library,
  kids: Baby,
  'test-prep': GraduationCap,
  biography: User,
  science: FlaskConical,
  history: Landmark,
  'self-help': Sparkles,
  romance: Heart,
  thriller: Search,
  fantasy: Wand2,
  other: Package,
};

export default function CategoryIcon({ category, className = 'w-5 h-5', ...props }) {
  const Icon = ICON_MAP[category] || Package;
  return <Icon className={className} {...props} />;
}

export function CategoryIconBadge({ category, size = 'md' }) {
  const sizes = {
    sm: { wrap: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { wrap: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { wrap: 'w-12 h-12', icon: 'w-6 h-6' },
  };
  const s = sizes[size] || sizes.md;
  return (
    <div className={`${s.wrap} rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-100 transition-colors`}>
      <CategoryIcon category={category} className={s.icon} />
    </div>
  );
}
