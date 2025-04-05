import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/app-header';

const GuestLayout = () => {
  const { loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // No redirect here – just show the guest layout
  return (
    <div>
      <AppHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default GuestLayout;