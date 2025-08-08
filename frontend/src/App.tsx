// ==============================================================================
// File: frontend/src/App.tsx (FINAL VERSION)
// ==============================================================================
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CampaignProvider } from './context/CampaignContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './AppRoutes';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CampaignProvider>
          <Router>
            <AppRoutes />
          </Router>
        </CampaignProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;