import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/Homepage/Homepage.jsx';
import Questionnaire from './pages/Questionnaire/Questionnaire.jsx';
import Simulator from './pages/Simulator/Simulator.jsx';
import SimulatorTwo from './pages/Simulator/SimulatorTwo';
import RewardsModel from './pages/Rewardsmodel/Rewardsmodel.jsx';
import Evaluation from './pages/Questionnaire/Evaluation.jsx'; // Evaluation Seite hinzugefügt
import NavigationBar from './components/NavigationBar';
import Footer from './components/Footer';
import './styles/App.css';

function App() {
  return (
    <Router>
      <NavigationBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/simulatorTwo" element={<SimulatorTwo />} />
        <Route path="/rewardsmodel" element={<RewardsModel />} />
        <Route path="/evaluation" element={<Evaluation />} /> 
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
