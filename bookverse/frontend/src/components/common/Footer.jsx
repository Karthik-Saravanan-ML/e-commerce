import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <BookOpen className="w-5 h-5 text-primary-400" />
              BookVerse
            </div>
            <p className="text-sm leading-relaxed">Your complete book ecosystem — buy, read, listen, and connect with authors worldwide.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Shop</h4>
            <ul className="space-y-2 text-sm">
              {[['Fiction', '/category/fiction'], ['Non-Fiction', '/category/non-fiction'], ['Kids', '/category/kids'], ['Test Prep', '/category/test-prep']].map(([label, path]) => (
                <li key={path}><Link to={path} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              {[['Reading Library', '/library'], ['Subscription Plans', '/subscription'], ['Best Sellers', '/shop?isBestSeller=true'], ['New Arrivals', '/shop?sort=-createdAt']].map(([label, path]) => (
                <li key={path}><Link to={path} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">For Writers</h4>
            <ul className="space-y-2 text-sm">
              {[['Publish Your Book', '/register?role=writer'], ['Writer Studio', '/writer'], ['Connect with Authors', '/writer/network']].map(([label, path]) => (
                <li key={path}><Link to={path} className="hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
          <p>© {new Date().getFullYear()} BookVerse. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
