import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function SectionHeader({ title, subtitle, actionLabel, actionTo, icon: Icon }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="section-title flex items-center gap-2.5">
          {Icon && (
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 text-primary-600">
              <Icon className="w-4 h-4" />
            </span>
          )}
          {title}
        </h2>
        {subtitle && <p className="section-subtitle mb-0 mt-1">{subtitle}</p>}
      </div>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 whitespace-nowrap">
          {actionLabel} <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
