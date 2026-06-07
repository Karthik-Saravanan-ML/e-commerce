import { Link } from 'react-router-dom';
import { BookOpen, Mail } from 'lucide-react';

const FOOTER_LINKS = {
  Shop: [
    ['Fiction', '/category/fiction'],
    ['Non-Fiction', '/category/non-fiction'],
    ['Kids', '/category/kids'],
    ['Test Prep', '/category/test-prep'],
  ],
  Platform: [
    ['Reading Library', '/library'],
    ['Subscription Plans', '/subscription'],
    ['Best Sellers', '/shop?isBestSeller=true'],
    ['New Arrivals', '/shop?sort=-createdAt'],
  ],
  Writers: [
    ['Publish Your Book', '/register?role=writer'],
    ['Writer Studio', '/writer'],
    ['Author Network', '/writer/network'],
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-auto">
      <div className="page-container py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg mb-4">
              <span className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </span>
              BookVerse
            </div>
            <p className="text-sm leading-relaxed max-w-sm text-gray-400">
              Your complete book ecosystem — buy physical books, read ebooks, listen to audiobooks, and connect with authors worldwide.
            </p>
            <div className="flex items-center gap-2 mt-5 text-sm text-gray-500">
              <Mail className="w-4 h-4" />
              <span>support@bookverse.com</span>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(([label, path]) => (
                  <li key={path}>
                    <Link to={path} className="text-sm hover:text-white transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800/80 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-gray-500">© {new Date().getFullYear()} BookVerse. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
