import React, { useState, useEffect } from 'react';
import { Button, Typography, Grid, Box, Paper, TextField, Tooltip } from '@mui/material';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js';
import { useNavigate } from 'react-router-dom';

// Registering scales and the Filler plugin in Chart.js
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

const Simulator = () => {
  const [livePrice, setLivePrice] = useState(null);
  const [adaAmount, setAdaAmount] = useState(100); // Default value of 100 ADA
  const [rewardEstimate, setRewardEstimate] = useState({ day: { min: 0, max: 0 }, epoch: { min: 0, max: 0 }, month: { min: 0, max: 0 }, year: { min: 0, max: 0 } });
  const [epochData, setEpochData] = useState([]);
  const [chartType, setChartType] = useState('price'); // 'price' or 'marketcap'
  const [rho, setRho] = useState(0.003); // Default Rho
  const [tau, setTau] = useState(0.2);  // Default Tau
  const [theta, setTheta] = useState(0.8); // Default Theta
  const navigate = useNavigate();

  // Fetch the live ADA price from API
  useEffect(() => {
    const fetchLivePrice = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd');
        setLivePrice(response.data.cardano.usd);
      } catch (error) {
        console.error('Error fetching live ADA price', error);
      }
    };
    fetchLivePrice();
  }, []);

  // Fetch historical price or market cap data from API
  useEffect(() => {
    const fetchEpochData = async () => {
      try {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/cardano/market_chart?vs_currency=usd&days=90` // Fixed to 90 days of data
        );
        const prices = response.data.prices.map((point) => ({
          x: new Date(point[0]).toLocaleDateString(),
          y: point[1]
        }));
        const marketCaps = response.data.market_caps.map((point) => ({
          x: new Date(point[0]).toLocaleDateString(),
          y: point[1]
        }));
        setEpochData(chartType === 'price' ? prices : marketCaps);
      } catch (error) {
        console.error('Error fetching epoch data', error);
      }
    };
    fetchEpochData();
  }, [chartType]);

  // Function to calculate estimated rewards with a range
  const calculateRewards = () => {
    if (livePrice) {
      const fluctuation = 0.1; // Simulate a 10% fluctuation
      const minRho = rho * (1 - fluctuation), maxRho = rho * (1 + fluctuation);
      const minTau = tau * (1 - fluctuation), maxTau = tau * (1 + fluctuation);
      const minTheta = theta * (1 - fluctuation), maxTheta = theta * (1 + fluctuation);

      const minDailyReward = adaAmount * livePrice * minRho * minTau * minTheta;
      const maxDailyReward = adaAmount * livePrice * maxRho * maxTau * maxTheta;

      const minEpochReward = minDailyReward * 5; // Assuming 1 epoch = 5 days
      const maxEpochReward = maxDailyReward * 5;

      const minMonthlyReward = minDailyReward * 30;
      const maxMonthlyReward = maxDailyReward * 30;

      const minYearlyReward = minDailyReward * 365;
      const maxYearlyReward = maxDailyReward * 365;

      setRewardEstimate({
        day: { min: minDailyReward, max: maxDailyReward },
        epoch: { min: minEpochReward, max: maxEpochReward },
        month: { min: minMonthlyReward, max: maxMonthlyReward },
        year: { min: minYearlyReward, max: maxYearlyReward }
      });
    }
  };

  useEffect(() => {
    calculateRewards();
  }, [livePrice, adaAmount, rho, tau, theta]);

  const resetParams = () => {
    setRho(0.003);
    setTau(0.2);
    setTheta(0.8);
  };

  const data = {
    labels: epochData.map((point) => point.x),
    datasets: [
      {
        label: chartType === 'price' ? 'ADA Price (USD)' : 'Market Cap (USD)',
        data: epochData.map((point) => point.y),
        borderColor: 'rgba(255, 255, 255, 1)', // White for better contrast
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Light background
        fill: true, // Enable fill, needs Filler plugin
        tension: 0.1,
      }
    ]
  };

  const options = {
    scales: {
      x: {
        ticks: {
          color: '#fff', // White axis labels
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Light gridlines
        }
      },
      y: {
        ticks: {
          color: '#fff', // White axis labels
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Light gridlines
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#fff', // White legend text
        }
      }
    }
  };

  return (
    <div
      style={{
        backgroundImage: 'linear-gradient(to right, #FBA100, #7B658E)', // New gradient background
        minHeight: '100vh',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
        justifyContent: 'space-between', // Ensure both sections are aligned properly
      }}
    >
      {/* Title and Description */}
      <Box mb={3} style={{ textAlign: 'center' }}>
        <Typography variant="h4" sx={{ color: 'white', marginBottom: '10px' }}>Cardano Reward Simulator</Typography>
        <Typography variant="body1" style={{ marginTop: '8px', color: 'white' }}>
          Simulate rewards based on live ADA prices.
        </Typography>
      </Box>

      {/* Buttons for Switching Between Pages */}
      <Box mb={4} style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <Button
          variant="contained"
          onClick={() => navigate('/simulator')}
          style={{ color: '#fff', backgroundColor: '#4CAF50' }}
        >
          Simulator Page 1
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/simulatorTwo')}
          style={{ color: '#fff', borderColor: '#fff' }}
        >
          Reserve & Fees Analysis
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Left Side: Graphical Component */}
        <Grid item xs={12} md={6}>
          <Paper style={{ padding: '20px', background: 'rgba(51, 51, 51, 0.8)', minHeight: '460px' }}>
            <Typography variant="h6" gutterBottom style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
              {chartType === 'price' ? 'ADA Price Over Time (90 Days)' : 'Market Cap Over Time (90 Days)'}
            </Typography>
            <Line data={data} options={options} />
            <Box mt={3} style={{ textAlign: 'center' }}>
              <Button
                variant={chartType === 'price' ? 'contained' : 'outlined'}
                onClick={() => setChartType('price')}
                style={{ marginRight: '4px', color: '#fff', borderColor: '#fff', fontSize: '12px' }}
              >
                Price Chart
              </Button>
              <Button
                variant={chartType === 'marketcap' ? 'contained' : 'outlined'}
                onClick={() => setChartType('marketcap')}
                style={{ color: '#fff', borderColor: '#fff', fontSize: '12px' }}
              >
                Market Cap
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side: Parameters and ADA Price Section */}
        <Grid item xs={12} md={6}>
          <Paper style={{ padding: '20px', background: 'rgba(51, 51, 51, 0.8)', minHeight: '460px' }}>
            <Typography variant="h6" gutterBottom style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
              Adjustable Parameters
            </Typography>

            <Tooltip title="Rho determines the base reward rate and is affected by network dynamics" arrow>
              <TextField
                label="Reward Rate (Rho)"
                value={rho}
                onChange={(e) => setRho(Number(e.target.value))}
                placeholder="0.003"
                fullWidth
                variant="outlined"
                margin="dense"
                inputProps={{ inputMode: 'decimal', step: '0.001', pattern: '[0-9]*[.,]?[0-9]*' }}
                InputLabelProps={{ style: { color: '#fff' } }}
                InputProps={{ style: { color: '#fff' } }}
              />
            </Tooltip>

            <Tooltip title="Tau determines how quickly rewards are distributed and can vary based on network conditions" arrow>
              <TextField
                label="Distribution Rate (Tau)"
                value={tau}
                onChange={(e) => setTau(Number(e.target.value))}
                placeholder="0.2"
                fullWidth
                variant="outlined"
                margin="dense"
                inputProps={{ inputMode: 'decimal', step: '0.1', pattern: '[0-9]*[.,]?[0-9]*' }}
                InputLabelProps={{ style: { color: '#fff' } }}
                InputProps={{ style: { color: '#fff' } }}
              />
            </Tooltip>

            <Tooltip title="Theta represents the staking participation level in the network" arrow>
              <TextField
                label="Participation Rate (Theta)"
                value={theta}
                onChange={(e) => setTheta(Number(e.target.value))}
                placeholder="0.8"
                fullWidth
                variant="outlined"
                margin="dense"
                inputProps={{ inputMode: 'decimal', step: '0.1', pattern: '[0-9]*[.,]?[0-9]*' }}
                InputLabelProps={{ style: { color: '#fff' } }}
                InputProps={{ style: { color: '#fff' } }}
              />
            </Tooltip>

            <TextField
              label="Amount of ADA"
              value={adaAmount}
              onChange={(e) => setAdaAmount(Number(e.target.value))}
              placeholder="100"
              fullWidth
              variant="outlined"
              margin="dense"
              inputProps={{ inputMode: 'decimal', step: '0.1', pattern: '[0-9]*[.,]?[0-9]*' }}
              InputLabelProps={{ style: { color: '#fff' } }}
              InputProps={{ style: { color: '#fff' } }}
            />

            <Button onClick={resetParams} variant="contained" style={{ marginTop: '8px', fontSize: '12px' }}>
              Reset to Default
            </Button>
          </Paper>

          {/* Current ADA Price */}
          <Paper style={{ padding: '10px', marginTop: '20px', background: 'rgba(51, 51, 51, 0.8)', minHeight: '50px' }}>
            <Typography variant="h6" gutterBottom style={{ color: 'white', textAlign: 'center', marginBottom: '5px' }}>
              Current ADA Price
            </Typography>
            <Typography variant="h5" style={{ color: '#fff', textAlign: 'center' }}>
              {livePrice ? `$${livePrice}` : 'Fetching price...'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Rewards Section */}
      <Box mt={4} style={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
        {['day', 'epoch', 'month', 'year'].map((period) => (
          <Paper key={period} style={{ backgroundColor: '#333', padding: '10px', borderRadius: '8px', width: '20%' }}>
            <Typography variant="body1" style={{ color: '#fff', textAlign: 'center' }}>
              {period === 'day' ? '1 Day' : period === 'epoch' ? '1 Epoch (5 Days)' : period === 'month' ? '1 Month' : '1 Year'}
            </Typography>
            <Typography variant="h6" style={{ textAlign: 'center', color: '#fff' }}>
              {rewardEstimate ? `${rewardEstimate[period].min.toFixed(2)} - ${rewardEstimate[period].max.toFixed(2)} ADA` : 'Calculating...'}
            </Typography>
            <Typography variant="body2" style={{ textAlign: 'center', color: '#fff' }}>
              {rewardEstimate ? `${(rewardEstimate[period].min * livePrice).toFixed(2)} - ${(rewardEstimate[period].max * livePrice).toFixed(2)} USD` : 'Calculating...'}
            </Typography>
          </Paper>
        ))}
      </Box>
    </div>
  );
};

export default Simulator;
