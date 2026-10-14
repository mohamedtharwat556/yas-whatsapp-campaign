import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateCampaign from './pages/CreateCampaign';
import CampaignLanding from './pages/CampaignLanding';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CreateCampaign />} />
        <Route path="/campaigns/:slug" element={<CampaignLanding />} />
      </Routes>
    </Router>
  );
}

export default App;
