import React, { useState, useEffect, useRef } from 'react';
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

const Simulator = () => {
  const [livePrice, setLivePrice] = useState(null);
  const [adaAmount, setAdaAmount] = useState(100); // Default value of 100 ADA
  const [rewardEstimate, setRewardEstimate] = useState({
    day: { min: 0, max: 0 },
    epoch: { min: 0, max: 0 },
    month: { min: 0, max: 0 },
    year: { min: 0, max: 0 },
  });
  const [epochData, setEpochData] = useState([]);
  const [chartType, setChartType] = useState('price'); // 'price' or 'marketcap'
  const [rho, setRho] = useState(0.003); // Default Rho
  const [tau, setTau] = useState(0.2); // Default Tau
  const [theta, setTheta] = useState(0.8); // Default Theta
  const navigate = useNavigate();

  // Ref to store intervals
  const livePriceIntervalRef = useRef(null);
  const dataUpdateIntervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Function to fetch and store historical data
  const fetchAndStoreHistoricalData = async () => {
    try {
      // Fetch historical data for the last 90 days
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/cardano/market_chart?vs_currency=usd&days=90`
      );
      // Store data in localStorage
      localStorage.setItem('historicalData', JSON.stringify(response.data));
      // Store the last update timestamp
      localStorage.setItem('lastHistoricalUpdate', Date.now().toString());
      processHistoricalData(response.data);
    } catch (error) {
      console.error('Error fetching historical data', error);
    }
  };

  // Function to process historical data
  const processHistoricalData = (data) => {
    let dataPoints = chartType === 'price' ? data.prices : data.market_caps;

    // Limit the number of data points for performance
    const maxPoints = 1000;
    if (dataPoints.length > maxPoints) {
      const factor = Math.ceil(dataPoints.length / maxPoints);
      dataPoints = dataPoints.filter((_, index) => index % factor === 0);
    }

    const formattedData = dataPoints.map((point) => ({
      x: new Date(point[0]).toLocaleDateString(),
      y: point[1],
    }));

    setEpochData(formattedData);
  };

  // Fetch historical data on component mount
  useEffect(() => {
    const fetchData = async () => {
      const historicalData = localStorage.getItem('historicalData');
      const lastUpdate = localStorage.getItem('lastHistoricalUpdate');
      const now = Date.now();

      if (historicalData && lastUpdate && now - parseInt(lastUpdate, 10) < 24 * 60 * 60 * 1000) {
        const data = JSON.parse(historicalData);
        processHistoricalData(data);
      } else {
        await fetchAndStoreHistoricalData();
      }
    };
    fetchData();

    // Set interval to update historical data every 24 hours
    dataUpdateIntervalRef.current = setInterval(fetchAndStoreHistoricalData, 24 * 60 * 60 * 1000);

    return () => {
      clearInterval(dataUpdateIntervalRef.current);
    };
  }, [chartType]);

  // Function to fetch live ADA price
  const fetchLivePrice = async () => {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd'
      );
      const price = response.data.cardano.usd;
      setLivePrice(price);
      localStorage.setItem('livePrice', price);
      localStorage.setItem('lastPriceUpdate', Date.now().toString());
    } catch (error) {
      console.error('Error fetching live ADA price', error);
      // Retry every 30 seconds if an error occurs
      retryTimeoutRef.current = setTimeout(fetchLivePrice, 30 * 1000);
    }
  };

  // Fetch live price on component mount
  useEffect(() => {
    const fetchData = async () => {
      const cachedPrice = localStorage.getItem('livePrice');
      const lastFetchTime = localStorage.getItem('lastPriceUpdate');

      if (cachedPrice && lastFetchTime) {
        const age = Date.now() - parseInt(lastFetchTime, 10);
        if (age < 6 * 60 * 60 * 1000) {
          setLivePrice(parseFloat(cachedPrice));
        } else {
          await fetchLivePrice();
        }
      } else {
        await fetchLivePrice();
      }
    };
    fetchData();

    // Set interval to update live price every 6 hours
    livePriceIntervalRef.current = setInterval(fetchLivePrice, 6 * 60 * 60 * 1000);

    return () => {
      clearInterval(livePriceIntervalRef.current);
      clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  // Function to calculate estimated rewards with a range
  const calculateRewards = () => {
    if (livePrice) {
      // Constants
      const totalAdaSupply = 45000000000; // Total ADA Supply
      const reserve = 14000000000; // Current Reserve
      const epochLength = 5; // Days in an epoch

      // Fluctuation factor (±10%)
      const fluctuation = 0.1;

      // Calculate parameter ranges
      const minRho = rho * (1 - fluctuation);
      const maxRho = rho * (1 + fluctuation);
      const minTau = tau * (1 - fluctuation);
      const maxTau = tau * (1 + fluctuation);
      const minTheta = theta * (1 - fluctuation);
      const maxTheta = theta * (1 + fluctuation);

      // Calculate Total Active Stake ranges
      const minTotalActiveStake = minTheta * totalAdaSupply;
      const maxTotalActiveStake = maxTheta * totalAdaSupply;

      // Calculate Total Rewards per Epoch ranges
      const minTotalRewards = minRho * reserve * (1 - maxTau);
      const maxTotalRewards = maxRho * reserve * (1 - minTau);

      // Calculate Individual Reward per Epoch ranges
      const minIndividualEpochReward = minTotalRewards * (adaAmount / maxTotalActiveStake);
      const maxIndividualEpochReward = maxTotalRewards * (adaAmount / minTotalActiveStake);

      // Calculate Rewards for Other Periods
      const minDailyReward = minIndividualEpochReward / epochLength;
      const maxDailyReward = maxIndividualEpochReward / epochLength;

      const minMonthlyReward = minDailyReward * 30;
      const maxMonthlyReward = maxDailyReward * 30;

      const minYearlyReward = minDailyReward * 365;
      const maxYearlyReward = maxDailyReward * 365;

      setRewardEstimate({
        day: { min: minDailyReward, max: maxDailyReward },
        epoch: { min: minIndividualEpochReward, max: maxIndividualEpochReward },
        month: { min: minMonthlyReward, max: maxMonthlyReward },
        year: { min: minYearlyReward, max: maxYearlyReward },
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
    setAdaAmount(100);
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
      },
    ],
  };

  const options = {
    scales: {
      x: {
        ticks: {
          color: '#fff', // White axis labels
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Light gridlines
        },
      },
      y: {
        ticks: {
          color: '#fff', // White axis labels
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)', // Light gridlines
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#fff', // White legend text
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
        backgroundImage: 'linear-gradient(to right, #FBA100, #7B658E)', // New gradient background
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
          Cardano Reward Simulator
        </Typography>
        <Typography variant="body1" style={{ marginTop: '8px', color: 'white' }}>
          Simulate rewards based on live ADA prices and adjustable parameters.
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
          style={selectedButtonStyle}
        >
          Rewards Simulation
        </Button>
        <Button
          variant="contained"
          onClick={() => navigate('/simulatorTwo')}
          style={buttonStyle}
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
              {chartType === 'price' ? 'ADA Price Over Last 90 Days' : 'Market Cap Over Last 90 Days'}
            </Typography>
            <div style={{ flexGrow: 1, overflow: 'hidden' }}>
              {epochData.length > 0 ? (
                <Line data={data} options={options} />
              ) : (
                <Typography variant="body1" style={{ color: '#fff', textAlign: 'center' }}>
                  Loading chart data...
                </Typography>
              )}
            </div>
            <Box mt={3} style={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                onClick={() => setChartType('price')}
                style={{
                  ...buttonStyle,
                  ...(chartType === 'price' && selectedButtonStyle),
                  marginRight: '8px',
                }}
              >
                Price Chart
              </Button>
              <Button
                variant="contained"
                onClick={() => setChartType('marketcap')}
                style={{
                  ...buttonStyle,
                  ...(chartType === 'marketcap' && selectedButtonStyle),
                }}
              >
                Market Cap
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side: Parameters and ADA Price Section */}
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
                The rewards are calculated based on the monetary expansion rate (ρ), treasury ratio (τ),
                and participation rate (θ). Adjust these parameters to see how they influence your staking rewards.
                The calculations assume a total ADA supply of 45,000,000,000 and a reserve of 14,000,000,000 ADA.
                A fluctuation of ±10% is applied to parameters to estimate the best and worst-case scenarios.
                Actual rewards may vary due to network conditions and other factors.
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
                title="The amount of ADA you are staking."
                arrow
              >
                <TextField
                  type="number"
                  step="any"
                  label="Amount of ADA"
                  value={adaAmount}
                  onChange={(e) => setAdaAmount(Number(e.target.value))}
                  placeholder="100"
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

            {/* Current ADA Price */}
            <Paper
              style={{
                padding: '10px',
                background: 'rgba(51, 51, 51, 0.8)',
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                style={{ color: 'white', textAlign: 'center', marginBottom: '5px' }}
              >
                Current ADA Price
              </Typography>
              <Typography variant="h5" style={{ color: '#fff', textAlign: 'center' }}>
                {livePrice ? `$${livePrice}` : 'Fetching price...'}
              </Typography>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Rewards Section */}
      <Box mt={4} style={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}>
        {['day', 'epoch', 'month', 'year'].map((period) => (
          <Paper
            key={period}
            style={{
              backgroundColor: '#333',
              padding: '10px',
              borderRadius: '8px',
              width: '20%',
            }}
          >
            <Typography variant="body1" style={{ color: '#fff', textAlign: 'center' }}>
              {period === 'day'
                ? '1 Day'
                : period === 'epoch'
                ? '1 Epoch (5 Days)'
                : period === 'month'
                ? '1 Month'
                : '1 Year'}
            </Typography>
            <Typography variant="h6" style={{ textAlign: 'center', color: '#fff' }}>
              {rewardEstimate
                ? `${rewardEstimate[period].min.toFixed(6)} - ${rewardEstimate[period].max.toFixed(6)} ADA`
                : 'Calculating...'}
            </Typography>
            <Typography variant="body2" style={{ textAlign: 'center', color: '#fff' }}>
              {rewardEstimate
                ? `$${(rewardEstimate[period].min * livePrice).toFixed(2)} - $${(
                    rewardEstimate[period].max * livePrice
                  ).toFixed(2)} USD`
                : 'Calculating...'}
            </Typography>
          </Paper>
        ))}
      </Box>
    </div>
  );
};

export default Simulator;
