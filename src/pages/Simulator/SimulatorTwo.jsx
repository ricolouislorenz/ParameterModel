import React, { useState, useEffect } from 'react';
import { Button, Typography, Grid, Box, Paper, TextField, Tooltip } from '@mui/material';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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

// Registering scales and the Filler plugin in Chart.js
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

const SimulatorTwo = () => {
  const [rho, setRho] = useState(0.003); // Monetary expansion parameter
  const [tau, setTau] = useState(0.2); // Treasury growth parameter
  const [theta, setTheta] = useState(0.8); // Participation parameter
  const [historicalData, setHistoricalData] = useState([]); // Historical data for Fees, Rewards, Reserve
  const [projectionData, setProjectionData] = useState([]); // Future projections
  const [chartType, setChartType] = useState('reserve'); // Default chart view
  const navigate = useNavigate(); // For switching between pages

  const eta = 1; // Assuming eta is 1

  // Fetch historical data for Fees, Rewards, Reserve
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        // Replace with actual API endpoints or data sources
        const feesResponse = await axios.get('/api/fees/historical');
        const rewardsResponse = await axios.get('/api/rewards/historical');
        const reserveResponse = await axios.get('/api/reserve/historical');

        const combinedData = feesResponse.data.map((feeData, index) => ({
          date: new Date(feeData.date).toLocaleDateString(),
          fees: feeData.value,
          rewards: rewardsResponse.data[index].value,
          reserve: reserveResponse.data[index].value,
        }));

        setHistoricalData(combinedData);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };
    fetchHistoricalData();
  }, []);

  // Function to compute projections
  const computeProjections = () => {
    const projections = [];
    let currentReserve = historicalData[historicalData.length - 1]?.reserve || 0;
    const p = 0.8; // Assuming active/total ratio
    const frew = 1; // Assuming frew is 1

    for (let i = 0; i < 365; i++) {
      const reserveRatio = updateReserve(rho, eta, tau, frew, p);
      currentReserve *= reserveRatio;
      projections.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString(),
        reserve: currentReserve,
      });
    }
    setProjectionData(projections);
  };

  useEffect(() => {
    if (historicalData.length > 0) {
      computeProjections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rho, tau, theta, historicalData]);

  const resetParams = () => {
    setRho(0.003);
    setTau(0.2);
    setTheta(0.8);
  };

  // Mathematical functions translated to JavaScript
  const updateReserve = (rho, eta, tau, frew, p) => {
    return 1 - rho * eta * (tau + (1 - tau) * frew * p);
  };

  const data = {
    labels: [
      ...historicalData.map((point) => point.date),
      ...projectionData.map((point) => point.date),
    ],
    datasets: [
      {
        label: 'Historical Fees',
        data: historicalData.map((point) => point.fees),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
        tension: 0.1,
        hidden: chartType !== 'fees',
      },
      {
        label: 'Historical Rewards',
        data: historicalData.map((point) => point.rewards),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.1,
        hidden: chartType !== 'rewards',
      },
      {
        label: 'Historical Reserve',
        data: historicalData.map((point) => point.reserve),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.1,
        hidden: chartType !== 'reserve',
      },
      {
        label: 'Projected Reserve',
        data: projectionData.map((point) => point.reserve),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        fill: true,
        tension: 0.1,
        hidden: chartType !== 'reserve',
      },
    ],
  };

  const options = {
    scales: {
      x: {
        ticks: {
          color: '#ffffff', // White axis labels
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Light gridlines
        },
      },
      y: {
        ticks: {
          color: '#ffffff', // White axis labels
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Light gridlines
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#ffffff', // White legend text
        },
      },
    },
  };

  return (
    <div
      style={{
        backgroundImage: 'linear-gradient(to right, #FBA100, #7B658E)', // Matching background
        minHeight: '100vh',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
      }}
    >
      {/* Title and Description */}
      <Box mb={1} style={{ textAlign: 'center' }}>
        <Typography variant="h4" style={{ color: 'white', marginBottom: '10px' }}>
          Cardano Reserve and Staking Analysis
        </Typography>
        <Typography variant="body1" style={{ marginTop: '8px', color: 'white' }}>
          Compare historical and future projections for Fees, Rewards, and Reserve.
        </Typography>
      </Box>

      {/* Navigation between pages */}
      <Box mb={2} style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/simulator')}
          style={{ color: '#fff', borderColor: '#fff' }}
        >
          Simulator Page 1
        </Button>
        <Button
          variant="contained"
          onClick={() => navigate('/simulatorTwo')}
          style={{ color: '#fff', backgroundColor: '#4CAF50' }}
        >
          Simulator Page 2
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
            <Typography variant="h6" gutterBottom style={{ color: 'white', textAlign: 'center' }}>
              {chartType === 'fees'
                ? 'Historical Fees'
                : chartType === 'rewards'
                ? 'Historical Rewards'
                : 'Reserve Over Time'}
            </Typography>
            <div style={{ flexGrow: 1 }}>
              <Line data={data} options={options} />
            </div>
            <Box mt={3} style={{ textAlign: 'center' }}>
              <Button
                variant={chartType === 'reserve' ? 'contained' : 'outlined'}
                onClick={() => setChartType('reserve')}
                style={{ marginRight: '8px', color: '#fff', borderColor: '#fff', fontSize: '12px' }}
              >
                Show Reserve
              </Button>
              <Button
                variant={chartType === 'fees' ? 'contained' : 'outlined'}
                onClick={() => setChartType('fees')}
                style={{ marginRight: '8px', color: '#fff', borderColor: '#fff', fontSize: '12px' }}
              >
                Show Fees
              </Button>
              <Button
                variant={chartType === 'rewards' ? 'contained' : 'outlined'}
                onClick={() => setChartType('rewards')}
                style={{ color: '#fff', borderColor: '#fff', fontSize: '12px' }}
              >
                Show Rewards
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side: Parameters */}
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
            <Typography variant="h6" gutterBottom style={{ color: 'white', textAlign: 'center' }}>
              Adjustable Parameters
            </Typography>
            <Tooltip
              title="Monetary expansion parameter affecting reserve updates"
              arrow
            >
              <TextField
                label="Monetary Expansion Rate (Rho)"
                value={rho}
                onChange={(e) => setRho(parseFloat(e.target.value))}
                type="number"
                fullWidth
                margin="normal"
                InputLabelProps={{ style: { color: '#fff' } }}
                InputProps={{ style: { color: '#fff' } }}
              />
            </Tooltip>
            <Tooltip
              title="Treasury growth parameter influencing reserve calculations"
              arrow
            >
              <TextField
                label="Treasury Growth Factor (Tau)"
                value={tau}
                onChange={(e) => setTau(parseFloat(e.target.value))}
                type="number"
                fullWidth
                margin="normal"
                InputLabelProps={{ style: { color: '#fff' } }}
                InputProps={{ style: { color: '#fff' } }}
              />
            </Tooltip>
            <Tooltip
              title="Participation parameter representing staking participation"
              arrow
            >
              <TextField
                label="Participation Rate (Theta)"
                value={theta}
                onChange={(e) => setTheta(parseFloat(e.target.value))}
                type="number"
                fullWidth
                margin="normal"
                InputLabelProps={{ style: { color: '#fff' } }}
                InputProps={{ style: { color: '#fff' } }}
              />
            </Tooltip>
            <Button
              onClick={resetParams}
              variant="contained"
              style={{ marginTop: '20px', fontSize: '12px' }}
            >
              Reset to Default
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default SimulatorTwo;
