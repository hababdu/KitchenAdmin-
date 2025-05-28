import { Outlet, NavLink } from 'react-router-dom';
import {
  HomeIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-blue-600">Oshxona admini </h1>
            <div className="hidden md:block">
              <nav className="flex space-x-8">
             
                
                <NavLink
                  to="/"
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`
                  }
                >
                  <div className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2" />
                   Buyurtmalar
                  </div>
                </NavLink>
                <NavLink
                  to="/profile"
                  className={({ isActive }) => 
                    `px-3 py-2 rounded-md text-sm font-medium ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`
                  }
                >
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Profile
                  </div>
                </NavLink>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200">
        <nav className="flex justify-around">
         
          <NavLink
            to="/orders"
            className={({ isActive }) => 
              `flex flex-col items-center py-3 px-4 text-xs ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }
          >
            <ShoppingCartIcon className="h-6 w-6" />
            <span className="mt-1">Orders</span>
          </NavLink>
          
          <NavLink
            to="/profile"
            className={({ isActive }) => 
              `flex flex-col items-center py-3 px-4 text-xs ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`
            }
          >
            <UserIcon className="h-6 w-6" />
            <span className="mt-1">Profile</span>
          </NavLink>
        </nav>
      </div>

      {/* Footer */}
      <footer className="bg-white py-4 border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>&copy; 2025 Food Delivery App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;