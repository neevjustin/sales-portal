// File: frontend/src/pages/ActivityMenuPage.tsx

import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { User, Users, Star, Megaphone, Newspaper } from 'lucide-react';

const Card = ({ to, title, description, icon: Icon, allowed }: { to: string, title: string, description: string, icon: React.ElementType, allowed: boolean }) => {
  if (!allowed) return null;

  return (
    <Link to={to} className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-300">
      <div className="flex items-center">
        <Icon className="h-8 w-8 text-blue-500 mr-4" />
        <div>
          <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">{title}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </Link>
  );
};

export const ActivityMenuPage = () => {
  const { user } = useAuth();

  const canLogCustomerInteraction = user?.role === 'employee' || user?.role === 'team_leader' || user?.role === 'team_coordinator';
  const canLogMela = canLogCustomerInteraction;
  const canLogBAEvent = user?.role === 'ba_coordinator';

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Log an Activity</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          to="/log/customer-interaction"
          title="Customer Interaction"
          description="Log SIM Sales, MNP, House Visits, FTTH, etc."
          icon={User}
          allowed={canLogCustomerInteraction}
        />
        <Card
          to="/log/mela"
          title="Mela Event"
          description="Log details of promotional Melas conducted."
          icon={Users}
          allowed={canLogMela}
        />
        <Card
          to="/log/branding"
          title="Branding Activity"
          description="Submit photos of branding in CSCs or shops."
          icon={Star}
          allowed={canLogBAEvent}
        />
        <Card
          to="/log/special-event"
          title="Special Event"
          description="Log BA-level marketing events and roadshows."
          icon={Megaphone}
          allowed={canLogBAEvent}
        />
         <Card
          to="/log/press-release"
          title="Press Release"
          description="Submit press clippings for bonus points."
          icon={Newspaper}
          allowed={canLogBAEvent}
        />
      </div>
    </div>
  );
};