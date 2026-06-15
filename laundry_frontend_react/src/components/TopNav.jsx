import React from 'react';
import { LogOut } from 'lucide-react';

const TopNav = ({ user, onLogout }) => {
  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <img src="/logo.jpeg" alt="Smart Laundry" className="h-10 w-10 rounded-full object-cover mr-3 shadow-md border border-gray-100" />
            <span className="font-bold text-xl text-primary tracking-tight">Smart Laundry</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 hidden sm:block text-sm">
              Welcome, <span className="font-semibold">{user?.name}</span> <span className="text-xs uppercase bg-gray-100 px-2 py-1 rounded-full text-gray-500 ml-1">{user?.role}</span>
            </span>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors font-medium ml-2 bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-lg"
            >
              <LogOut size={18} />
              <span className="hidden sm:block text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
