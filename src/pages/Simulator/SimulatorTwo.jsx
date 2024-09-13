import React, { useState, useEffect } from 'react';
import { Button, Typography, Grid, Box, Paper, TextField } from '@mui/material';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Registering scales and the Filler plugin in Chart.js
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const SimulatorTwo = () => {
  const [rho, setRho] = useState(0.003);  // Monetary expansion parameter
  const [tau, setTau] = useState(0.2);    // Treasury growth parameter
  const [theta, setTheta] = useState(0.8);  // Participation parameter
  const [startingReserve, setStartingReserve] = useState(1000000000); // Example starting reserve
  const [historicalReserves, setHistoricalReserves] = useState([]); // Historical reserves
  const [futureReserves, setFutureReserves] = useState([]);  // Future reserve projections
  const [chartType, setChartType] = useState('reserve'); // Default chart view
  const [stakingRewards, setStakingRewards] = useState([]); // Placeholder for staking rewards data
  const [transactionFees, setTransactionFees] = useState([]); // Placeholder for transaction fees data
  const navigate = useNavigate(); // For switching between pages

  // Fetch historical reserves data (5 years)
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/cardano/market_chart?vs_currency=usd&days=1825');
        const reserves = response.data.total_volumes.map((point) => ({
          x: new Date(point[0]).toLocaleDateString(),
          y: point[1],
        }));
        setStartingReserve(reserves[reserves.length - 1].y);  // Last reserve as starting point
        setHistoricalReserves(reserves);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };
    fetchHistoricalData();
  }, []);

  // Future reserves prediction based on user parameters
  const calculateFutureData = (currentReserve) => {
    let reserves = [currentReserve];
    for (let i = 0; i < 365; i++) {  // Simulate for 1 year
      const nextReserve = reserves[i] * (1 - rho * 0.1 * (tau + (1 - tau) * theta));  // Simplified reserve formula
      reserves.push(nextReserve);
    }
    return reserves;
  };

  useEffect(() => {
    if (startingReserve) {
      const reserves = calculateFutureData(startingReserve);
      setFutureReserves(reserves);
    }
  }, [rho, tau, theta, startingReserve]);

  const resetParams = () => {
    setRho(0.003);
    setTau(0.2);
    setTheta(0.8);
  };

  const data = {
    labels: [...historicalReserves.map((point) => point.x), ...Array.from({ length: 365 }, (_, idx) => new Date(Date.now() + idx * 24 * 60 * 60 * 1000).toLocaleDateString())],
    datasets: [
      {
        label: 'Historical Reserves (USD)',
        data: historicalReserves.map((point) => point.y),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.1,
        hidden: chartType !== 'reserve'
      },
      {
        label: 'Future Reserves (USD)',
        data: futureReserves,
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        fill: true,
        tension: 0.1,
        hidden: chartType !== 'reserve'
      },
      {
        label: 'Transaction Fees (USD)',
        data: transactionFees,
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        fill: true,
        tension: 0.1,
        hidden: chartType !== 'fees'
      },
      {
        label: 'Staking Rewards (USD)',
        data: stakingRewards,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.1,
        hidden: chartType !== 'rewards'
      }
    ]
  };

  const options = {
    scales: {
      x: {
        ticks: {
          color: '#ffffff', // White axis labels
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Light gridlines
        }
      },
      y: {
        ticks: {
          color: '#ffffff', // White axis labels
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Light gridlines
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#ffffff', // White legend text
        }
      }
    }
  };

  return (
    <div
      style={{
        backgroundImage: 'linear-gradient(to right, #ff7e5f, #feb47b)',  // Same background as Simulator
        minHeight: '100vh',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
      }}
    >
      {/* Title and Description */}
      <Box mb={4} style={{ textAlign: 'center' }}>
        <Typography variant="h3" style={{ color: 'black' }}>Cardano Reserve and Staking Analysis</Typography>
        <Typography variant="body1" style={{ marginTop: '16px', color: 'black' }}>
          Compare historical and future projections for ADA reserves, transaction fees, and staking pool rewards.
        </Typography>
      </Box>

      {/* Navigation between pages */}
      <Box mb={4} style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <Button
          variant="contained"
          onClick={() => navigate('/simulator')}
          style={{
            backgroundColor: '#424242',
            color: '#ffffff',
            fontSize: '14px',
            padding: '10px 20px'
          }}
        >
          Simulator Page 1
        </Button>
        <Button
          variant="contained"
          onClick={() => navigate('/simulatorTwo')}
          style={{
            backgroundColor: '#424242',
            color: '#ffffff',
            fontSize: '14px',
            padding: '10px 20px'
          }}
        >
          Simulator Page 2
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side: Graphical Component */}
        <Grid item xs={12} md={8}>
          <Paper style={{ padding: '16px', background: 'rgba(66, 66, 66, 0.8)' }}>
            <Typography variant="h5" gutterBottom>
              Historical and Future Reserves
            </Typography>
            <Line data={data} options={options} />
            <Box mt={2} style={{ textAlign: 'center' }}>
              <Button
                variant={chartType === 'reserve' ? 'contained' : 'outlined'}
                onClick={() => setChartType('reserve')}
                style={{ marginRight: '8px', color: '#fff', borderColor: '#fff' }}
              >
                Show Reserves
              </Button>
              <Button
                variant={chartType === 'fees' ? 'contained' : 'outlined'}
                onClick={() => setChartType('fees')}
                style={{ marginRight: '8px', color: '#fff', borderColor: '#fff' }}
              >
                Show Fees
              </Button>
              <Button
                variant={chartType === 'rewards' ? 'contained' : 'outlined'}
                onClick={() => setChartType('rewards')}
                style={{ color: '#fff', borderColor: '#fff' }}
              >
                Show Staking Rewards
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side: Parameters */}
        <Grid item xs={12} md={4}>
          <Paper style={{ padding: '16px', background: 'rgba(66, 66, 66, 0.8)' }}>
            <Typography variant="h5" gutterBottom>Adjust Parameters</Typography>
            <TextField
              label="Monetary Expansion Rate (Rho)"
              value={rho}
              onChange={(e) => setRho(parseFloat(e.target.value))}
              type="number"
              fullWidth
              margin="normal"
              InputProps={{ style: { color: '#fff' } }}
            />
            <TextField
              label="Treasury Growth Factor (Tau)"
              value={tau}
              onChange={(e) => setTau(parseFloat(e.target.value))}
              type="number"
              fullWidth
              margin="normal"
              InputProps={{ style: { color: '#fff' } }}
            />
            <TextField
              label="Participation Rate (Theta)"
              value={theta}
              onChange={(e) => setTheta(parseFloat(e.target.value))}
              type="number"
              fullWidth
              margin="normal"
              InputProps={{ style: { color: '#fff' } }}
            />
            <Button onClick={resetParams} variant="contained" style={{ marginTop: '20px' }}>
              Reset to Default
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default SimulatorTwo;
