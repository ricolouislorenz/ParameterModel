import React, { useState, useEffect } from 'react';
import { Button, Typography, Grid, Box, Paper, TextField, Tooltip } from '@mui/material';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useNavigate } from 'react-router-dom';

// Registering scales and the Filler plugin in Chart.js
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

const SimulatorTwo = () => {
  // State variables
  const [rho, setRho] = useState(0.003); // Monetary expansion parameter
  const [tau, setTau] = useState(0.2);   // Treasury growth parameter
  const [theta, setTheta] = useState(0.8); // Participation parameter
  const [fees, setFees] = useState(100000); // Fees per epoch
  const [chartType, setChartType] = useState('reserve'); // Default chart view
  const [projections, setProjections] = useState([]); // Projections data
  const [scenario, setScenario] = useState('neutral'); // Scenario: 'positive', 'neutral', 'negative'
  const navigate = useNavigate();

  // Initial values
  const initialReserve = 14000000000; // Example initial reserve in ADA
  const initialTreasury = 0; // Initial treasury amount

  // Function to reset parameters to default
  const resetParams = () => {
    setRho(0.003);
    setTau(0.2);
    setTheta(0.8);
    setFees(100000);
    setScenario('neutral');
  };

  // Function to apply scenario presets
  const applyScenario = (scenario) => {
    setScenario(scenario);
    if (scenario === 'positive') {
      setRho(0.005);  // Higher monetary expansion rate
      setTau(0.15);   // Lower treasury ratio
      setTheta(0.9);  // Higher participation rate
      setFees(150000); // Higher fees due to increased network activity
    } else if (scenario === 'negative') {
      setRho(0.002);  // Lower monetary expansion rate
      setTau(0.25);   // Higher treasury ratio
      setTheta(0.7);  // Lower participation rate
      setFees(50000);  // Lower fees due to decreased network activity
    } else {
      // Neutral scenario
      resetParams();
    }
  };

  // Function to simulate projections
  const simulateProjections = () => {
    const projections = [];
    let currentReserve = initialReserve;
    let currentTreasury = initialTreasury;
    const numEpochs = 365; // Simulate for 365 epochs
    const eta = 1; // Assuming eta is 1
    const frew = 1; // Assuming frew is 1
    const p = theta; // Participation rate

    for (let i = 0; i < numEpochs; i++) {
      const reserveReduction = rho * eta * (tau + (1 - tau) * frew * p);
      currentReserve *= (1 - reserveReduction);

      // Calculate total rewards including fees
      const totalRewards = (rho * eta * currentReserve + fees) * (1 - tau);

      // Update treasury with its share of rewards and fees
      currentTreasury += tau * (rho * eta * currentReserve + fees);

      // Record projections
      projections.push({
        epoch: i + 1,
        date: new Date(Date.now() + i * 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        reserve: currentReserve,
        treasury: currentTreasury,
        fees: fees,
        rewards: totalRewards,
      });
    }
    setProjections(projections);
  };

  // Recompute projections whenever parameters change
  useEffect(() => {
    simulateProjections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rho, tau, theta, fees]);

  // Chart data
  const data = {
    labels: projections.map((point) => point.date),
    datasets: [
      {
        label: 'Projected Reserve',
        data: projections.map((point) => point.reserve),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        fill: true,
        tension: 0.1,
        hidden: chartType !== 'reserve',
      },
      {
        label: 'Projected Treasury',
        data: projections.map((point) => point.treasury),
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        fill: true,
        tension: 0.1,
        hidden: chartType !== 'treasury',
      },
      {
        label: 'Projected Fees',
        data: projections.map((point) => point.fees),
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        fill: true,
        tension: 0.1,
        hidden: chartType !== 'fees',
      },
      {
        label: 'Projected Rewards',
        data: projections.map((point) => point.rewards),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.1,
        hidden: chartType !== 'rewards',
      },
    ],
  };

  // Chart options
  const options = {
    scales: {
      x: {
        ticks: {
          color: '#fff',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)',
        },
      },
      y: {
        ticks: {
          color: '#fff',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#fff',
        },
      },
    },
  };

  // Button styles
  const buttonStyle = {
    color: '#fff',
    backgroundColor: 'grey',
  };

  const selectedButtonStyle = {
    color: '#fff',
    backgroundColor: 'blue',
  };

  return (
    <div
      style={{
        backgroundImage: 'linear-gradient(to right, #FBA100, #7B658E)',
        minHeight: '100vh',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
      }}
    >
      {/* Title and Description */}
      <Box mb={1} style={{ textAlign: 'center' }}>
        <Typography variant="h4" sx={{ color: 'white', marginBottom: '10px' }}>
          Cardano Reserve and Staking Analysis
        </Typography>
        <Typography variant="body1" style={{ marginTop: '8px', color: 'white' }}>
          Compare historical and future projections for Fees, Rewards, Reserve, and Treasury.
        </Typography>
      </Box>

      {/* Buttons for Switching Between Pages */}
      <Box
        mb={2}
        style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}
      >
        <Button
          variant="contained"
          onClick={() => navigate('/simulator')}
          style={buttonStyle}
        >
          Rewards Simulation
        </Button>
        <Button
          variant="contained"
          onClick={() => navigate('/simulatorTwo')}
          style={selectedButtonStyle}
        >
          Reserve & Fees Analysis
        </Button>
      </Box>

      <Grid container spacing={4} alignItems="stretch">
        {/* Left Side: Graphical Component */}
        <Grid item xs={12} md={6}>
          <Paper
            style={{
              padding: '20px',
              background: 'rgba(51, 51, 51, 0.8)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}
            >
              {chartType === 'reserve'
                ? 'Projected Reserve Over Time'
                : chartType === 'treasury'
                ? 'Projected Treasury Over Time'
                : chartType === 'fees'
                ? 'Projected Fees Over Time'
                : 'Projected Rewards Over Time'}
            </Typography>
            <div style={{ flexGrow: 1 }}>
              {projections.length > 0 ? (
                <Line data={data} options={options} />
              ) : (
                <Typography
                  variant="body1"
                  style={{ color: '#fff', textAlign: 'center' }}
                >
                  Loading chart data...
                </Typography>
              )}
            </div>
            <Box mt={3} style={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                onClick={() => setChartType('reserve')}
                style={{
                  ...buttonStyle,
                  ...(chartType === 'reserve' && selectedButtonStyle),
                  marginRight: '8px',
                }}
              >
                Reserve
              </Button>
              <Button
                variant="contained"
                onClick={() => setChartType('treasury')}
                style={{
                  ...buttonStyle,
                  ...(chartType === 'treasury' && selectedButtonStyle),
                  marginRight: '8px',
                }}
              >
                Treasury
              </Button>
              <Button
                variant="contained"
                onClick={() => setChartType('fees')}
                style={{
                  ...buttonStyle,
                  ...(chartType === 'fees' && selectedButtonStyle),
                  marginRight: '8px',
                }}
              >
                Fees
              </Button>
              <Button
                variant="contained"
                onClick={() => setChartType('rewards')}
                style={{
                  ...buttonStyle,
                  ...(chartType === 'rewards' && selectedButtonStyle),
                }}
              >
                Rewards
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side: Parameters and Scenario Section */}
        <Grid item xs={12} md={6}>
          <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Explanatory Text */}
            <Paper
              style={{
                padding: '20px',
                background: 'rgba(51, 51, 51, 0.8)',
                marginBottom: '20px',
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                style={{ color: 'white', textAlign: 'center', marginBottom: '10px' }}
              >
                Important Information
              </Typography>
              <Typography variant="body2" style={{ color: '#fff' }}>
                Note: These projections are based on simplified models and assumptions. Actual outcomes may vary due to network conditions and other factors. The calculations are intended for illustrative purposes.
              </Typography>
            </Paper>

            <Paper
              style={{
                padding: '20px',
                background: 'rgba(51, 51, 51, 0.8)',
                marginBottom: '20px',
                flexGrow: 1,
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}
              >
                Adjustable Parameters
              </Typography>

              {/* Scenario Buttons */}
              <Box mb={2} style={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => applyScenario('positive')}
                  style={{
                    ...buttonStyle,
                    ...(scenario === 'positive' && selectedButtonStyle),
                    marginRight: '8px',
                  }}
                >
                  Positive Scenario
                </Button>
                <Button
                  variant="contained"
                  onClick={() => applyScenario('neutral')}
                  style={{
                    ...buttonStyle,
                    ...(scenario === 'neutral' && selectedButtonStyle),
                    marginRight: '8px',
                  }}
                >
                  Neutral Scenario
                </Button>
                <Button
                  variant="contained"
                  onClick={() => applyScenario('negative')}
                  style={{
                    ...buttonStyle,
                    ...(scenario === 'negative' && selectedButtonStyle),
                  }}
                >
                  Negative Scenario
                </Button>
              </Box>

              {/* Parameter Inputs */}
              <Tooltip
                title="Fraction of remaining reserves used as rewards per epoch (default 0.003)."
                arrow
              >
                <TextField
                  type="number"
                  step="any"
                  label="Monetary Expansion Rate (ρ)"
                  value={rho}
                  onChange={(e) => setRho(Number(e.target.value))}
                  placeholder="0.003"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputLabelProps={{ style: { color: '#fff' } }}
                  InputProps={{ style: { color: '#fff' } }}
                />
              </Tooltip>

              <Tooltip
                title="Fraction of rewards allocated to the treasury (default 0.2)."
                arrow
              >
                <TextField
                  type="number"
                  step="any"
                  label="Treasury Ratio (τ)"
                  value={tau}
                  onChange={(e) => setTau(Number(e.target.value))}
                  placeholder="0.2"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputLabelProps={{ style: { color: '#fff' } }}
                  InputProps={{ style: { color: '#fff' } }}
                />
              </Tooltip>

              <Tooltip
                title="Proportion of total ADA supply that is actively staked (default 0.8)."
                arrow
              >
                <TextField
                  type="number"
                  step="any"
                  label="Participation Rate (θ)"
                  value={theta}
                  onChange={(e) => setTheta(Number(e.target.value))}
                  placeholder="0.8"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputLabelProps={{ style: { color: '#fff' } }}
                  InputProps={{ style: { color: '#fff' } }}
                />
              </Tooltip>

              <Tooltip
                title="Average fees collected per epoch (default 100,000 ADA)."
                arrow
              >
                <TextField
                  type="number"
                  step="any"
                  label="Fees per Epoch"
                  value={fees}
                  onChange={(e) => setFees(Number(e.target.value))}
                  placeholder="100000"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputLabelProps={{ style: { color: '#fff' } }}
                  InputProps={{ style: { color: '#fff' } }}
                />
              </Tooltip>

              <Button
                onClick={resetParams}
                variant="contained"
                style={{ marginTop: '8px', fontSize: '12px' }}
              >
                Reset to Default
              </Button>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </div>
  );
};

export default SimulatorTwo;
