import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Typography,
  Grid,
  Box,
  Paper,
  TextField,
  Tooltip,
  InputAdornment,
  IconButton,
} from '@mui/material';
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
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

// Registering necessary Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const Simulator = () => {
  const [livePrice, setLivePrice] = useState(null);

  // State variables for raw input values
  const [rhoInput, setRhoInput] = useState('0,003');
  const [tauInput, setTauInput] = useState('0,2');
  const [thetaInput, setThetaInput] = useState('0,8');
  const [adaAmountInput, setAdaAmountInput] = useState('100');

  // Parsed numeric values
  const [rho, setRho] = useState(0.003);
  const [tau, setTau] = useState(0.2);
  const [theta, setTheta] = useState(0.8);
  const [adaAmount, setAdaAmount] = useState(100);

  const [rewardEstimate, setRewardEstimate] = useState({
    day: { min: 0, max: 0 },
    epoch: { min: 0, max: 0 },
    month: { min: 0, max: 0 },
    year: { min: 0, max: 0 },
  });
  const [epochData, setEpochData] = useState([]);
  const [chartType, setChartType] = useState('price'); // 'price' or 'marketcap'

  const navigate = useNavigate();

  // Refs for intervals
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

    // Limit the number of data points
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

      if (
        historicalData &&
        lastUpdate &&
        now - parseInt(lastUpdate, 10) < 24 * 60 * 60 * 1000
      ) {
        const data = JSON.parse(historicalData);
        processHistoricalData(data);
      } else {
        await fetchAndStoreHistoricalData();
      }
    };
    fetchData();

    // Set interval to update historical data every 24 hours
    dataUpdateIntervalRef.current = setInterval(
      fetchAndStoreHistoricalData,
      24 * 60 * 60 * 1000
    );

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

  // Function to calculate estimated rewards
  const calculateRewards = () => {
    if (livePrice) {
      // Constants
      const totalAdaSupply = 45000000000; // Total ADA supply
      const reserve = 14000000000; // Current reserve
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

      // Total active stake
      const minTotalActiveStake = minTheta * totalAdaSupply;
      const maxTotalActiveStake = maxTheta * totalAdaSupply;

      // Total rewards per epoch
      const minTotalRewards = minRho * reserve * (1 - maxTau);
      const maxTotalRewards = maxRho * reserve * (1 - minTau);

      // Individual rewards per epoch
      const minIndividualEpochReward =
        minTotalRewards * (adaAmount / maxTotalActiveStake);
      const maxIndividualEpochReward =
        maxTotalRewards * (adaAmount / minTotalActiveStake);

      // Rewards for other periods
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livePrice, adaAmount, rho, tau, theta]);

  // Update parsed values whenever input changes
  useEffect(() => {
    let value = rhoInput.replace(',', '.');
    let parsedValue = parseFloat(value);
    if (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 0.01) {
      parsedValue = parseFloat(parsedValue.toFixed(5));
      setRho(parsedValue);
    }
  }, [rhoInput]);

  useEffect(() => {
    let value = tauInput.replace(',', '.');
    let parsedValue = parseFloat(value);
    if (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 1) {
      parsedValue = parseFloat(parsedValue.toFixed(5));
      setTau(parsedValue);
    }
  }, [tauInput]);

  useEffect(() => {
    let value = thetaInput.replace(',', '.');
    let parsedValue = parseFloat(value);
    if (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 1) {
      parsedValue = parseFloat(parsedValue.toFixed(5));
      setTheta(parsedValue);
    }
  }, [thetaInput]);

  useEffect(() => {
    let value = adaAmountInput.replace(',', '.');
    let parsedValue = parseFloat(value);
    if (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 999999) {
      parsedValue = parseFloat(parsedValue.toFixed(5));
      setAdaAmount(parsedValue);
    }
  }, [adaAmountInput]);

  // Input handling functions
  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
  };

  const handleBlur = (
    inputValue,
    setInput,
    setValue,
    min,
    max,
    step,
    decimalPlaces
  ) => () => {
    let value = inputValue.replace('.', ',');
    let parsedValue = parseFloat(value.replace(',', '.'));

    if (isNaN(parsedValue)) {
      // Reset to previous valid value
      setInput(setValue().toString().replace('.', ','));
    } else {
      if (parsedValue < min) parsedValue = min;
      if (parsedValue > max) parsedValue = max;
      parsedValue = parseFloat(parsedValue.toFixed(decimalPlaces));
      setValue(parsedValue);
      setInput(parsedValue.toString().replace('.', ','));
    }
  };

  const incrementValue = (
    value,
    setValue,
    setInput,
    max,
    step,
    decimalPlaces
  ) => () => {
    let newValue = value + step;
    if (newValue > max) newValue = max;
    newValue = parseFloat(newValue.toFixed(decimalPlaces));
    setValue(newValue);
    setInput(newValue.toString().replace('.', ','));
  };

  const decrementValue = (
    value,
    setValue,
    setInput,
    min,
    step,
    decimalPlaces
  ) => () => {
    let newValue = value - step;
    if (newValue < min) newValue = min;
    newValue = parseFloat(newValue.toFixed(decimalPlaces));
    setValue(newValue);
    setInput(newValue.toString().replace('.', ','));
  };

  const resetParams = () => {
    setRho(0.003);
    setRhoInput('0,003');
    setTau(0.2);
    setTauInput('0,2');
    setTheta(0.8);
    setThetaInput('0,8');
    setAdaAmount(100);
    setAdaAmountInput('100');
  };

  const data = {
    labels: epochData.map((point) => point.x),
    datasets: [
      {
        label:
          chartType === 'price'
            ? 'ADA Price (USD)'
            : 'Market Cap (USD)',
        data: epochData.map((point) => point.y),
        borderColor: 'rgba(255, 255, 255, 1)', // White for better contrast
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Light background
        fill: true, // Enable fill
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

  // Icon button styles for white color
  const iconButtonStyle = {
    color: '#fff',
  };

  return (
    <div
      style={{
        backgroundImage: 'linear-gradient(to right, #FBA100, #7B658E)', // New gradient
        minHeight: '100vh',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
      }}
    >
      {/* Title and Description */}
      <Box mb={1} style={{ textAlign: 'center' }}>
        <Typography
          variant="h4"
          sx={{ color: 'white', marginBottom: '10px' }}
        >
          Cardano Reward Simulator
        </Typography>
        <Typography
          variant="body1"
          style={{ marginTop: '8px', color: 'white' }}
        >
          Simulate rewards based on live ADA prices and adjustable parameters.
        </Typography>
      </Box>

      {/* Buttons for Switching Between Pages */}
      <Box
        mb={2}
        style={{
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
        }}
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
              style={{
                color: 'white',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              {chartType === 'price'
                ? 'ADA Price Over Last 90 Days'
                : 'Market Cap Over Last 90 Days'}
            </Typography>
            <div style={{ flexGrow: 1, overflow: 'hidden' }}>
              {epochData.length > 0 ? (
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

        {/* Right Side: Parameters and ADA Price */}
        <Grid item xs={12} md={6}>
          <Box
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
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
                style={{
                  color: 'white',
                  textAlign: 'center',
                  marginBottom: '10px',
                }}
              >
                Important Information
              </Typography>
              <Typography variant="body2" style={{ color: '#fff' }}>
                The rewards are calculated using the following formula:
              </Typography>
              <Typography variant="body2" style={{ color: '#fff', marginTop: '10px' }}>
                <strong>Total Rewards per Epoch = ρ × Reserve × (1 - τ)</strong>
              </Typography>
              <Typography variant="body2" style={{ color: '#fff', marginTop: '10px' }}>
                <strong>
                  Individual Reward per Epoch = (Total Rewards per Epoch × Your Stake) / Total Active Stake
                </strong>
              </Typography>
              <Typography variant="body2" style={{ color: '#fff', marginTop: '10px' }}>
                Where:
                <ul>
                  <li><strong>ρ (Monetary Expansion Rate)</strong> is the fraction of remaining reserves used as rewards per epoch.</li>
                  <li><strong>τ (Treasury Ratio)</strong> is the fraction of rewards allocated to the treasury.</li>
                  <li><strong>Reserve</strong> is the remaining ADA reserve (currently 14,000,000,000 ADA).</li>
                  <li><strong>Your Stake</strong> is the amount of ADA you are staking.</li>
                  <li><strong>Total Active Stake</strong> is the total amount of ADA actively staked in the network.</li>
                </ul>
              </Typography>
              <Typography variant="body2" style={{ color: '#fff', marginTop: '10px' }}>
                Adjust the parameters below to see how they influence your staking rewards. A fluctuation of ±10% is applied to estimate the best and worst-case scenarios. Actual rewards may vary due to network conditions and other factors.
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
                style={{
                  color: 'white',
                  textAlign: 'center',
                  marginBottom: '20px',
                }}
              >
                Adjustable Parameters
              </Typography>

              <Tooltip
                title="Fraction of remaining reserves used as rewards per epoch (min 0, max 0.01)."
                arrow
              >
                <TextField
                  type="text"
                  label="Monetary Expansion Rate (ρ)"
                  value={rhoInput}
                  onChange={handleInputChange(setRhoInput)}
                  onBlur={handleBlur(
                    rhoInput,
                    setRhoInput,
                    () => rho,
                    0,
                    0.01,
                    0.001,
                    5
                  )}
                  placeholder="0,003"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputProps={{
                    style: { color: '#fff' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={decrementValue(
                            rho,
                            setRho,
                            setRhoInput,
                            0,
                            0.001,
                            5
                          )}
                          size="small"
                          style={iconButtonStyle}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <IconButton
                          onClick={incrementValue(
                            rho,
                            setRho,
                            setRhoInput,
                            0.01,
                            0.001,
                            5
                          )}
                          size="small"
                          style={iconButtonStyle}
                        >
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{ style: { color: '#fff' } }}
                />
              </Tooltip>

              <Tooltip
                title="Fraction of rewards allocated to the treasury (min 0, max 1)."
                arrow
              >
                <TextField
                  type="text"
                  label="Treasury Ratio (τ)"
                  value={tauInput}
                  onChange={handleInputChange(setTauInput)}
                  onBlur={handleBlur(
                    tauInput,
                    setTauInput,
                    () => tau,
                    0,
                    1,
                    0.1,
                    5
                  )}
                  placeholder="0,2"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputProps={{
                    style: { color: '#fff' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={decrementValue(
                            tau,
                            setTau,
                            setTauInput,
                            0,
                            0.1,
                            5
                          )}
                          size="small"
                          style={iconButtonStyle}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <IconButton
                          onClick={incrementValue(
                            tau,
                            setTau,
                            setTauInput,
                            1,
                            0.1,
                            5
                          )}
                          size="small"
                          style={iconButtonStyle}
                        >
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{ style: { color: '#fff' } }}
                />
              </Tooltip>

              <Tooltip
                title="Proportion of total ADA supply that is actively staked (min 0, max 1)."
                arrow
              >
                <TextField
                  type="text"
                  label="Participation Rate (θ)"
                  value={thetaInput}
                  onChange={handleInputChange(setThetaInput)}
                  onBlur={handleBlur(
                    thetaInput,
                    setThetaInput,
                    () => theta,
                    0,
                    1,
                    0.1,
                    5
                  )}
                  placeholder="0,8"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputProps={{
                    style: { color: '#fff' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={decrementValue(
                            theta,
                            setTheta,
                            setThetaInput,
                            0,
                            0.1,
                            5
                          )}
                          size="small"
                          style={iconButtonStyle}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <IconButton
                          onClick={incrementValue(
                            theta,
                            setTheta,
                            setThetaInput,
                            1,
                            0.1,
                            5
                          )}
                          size="small"
                          style={iconButtonStyle}
                        >
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{ style: { color: '#fff' } }}
                />
              </Tooltip>

              <Tooltip
                title="The amount of ADA you are staking (min 0, max 999999)."
                arrow
              >
                <TextField
                  type="text"
                  label="Amount of ADA"
                  value={adaAmountInput}
                  onChange={handleInputChange(setAdaAmountInput)}
                  onBlur={handleBlur(
                    adaAmountInput,
                    setAdaAmountInput,
                    () => adaAmount,
                    0,
                    999999,
                    10,
                    5
                  )}
                  placeholder="100"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputProps={{
                    style: { color: '#fff' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={decrementValue(
                            adaAmount,
                            setAdaAmount,
                            setAdaAmountInput,
                            0,
                            10,
                            5
                          )}
                          size="small"
                          style={iconButtonStyle}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <IconButton
                          onClick={incrementValue(
                            adaAmount,
                            setAdaAmount,
                            setAdaAmountInput,
                            999999,
                            10,
                            5
                          )}
                          size="small"
                          style={iconButtonStyle}
                        >
                          <AddIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  InputLabelProps={{ style: { color: '#fff' } }}
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
                style={{
                  color: 'white',
                  textAlign: 'center',
                  marginBottom: '5px',
                }}
              >
                Current ADA Price
              </Typography>
              <Typography
                variant="h5"
                style={{ color: '#fff', textAlign: 'center' }}
              >
                {livePrice ? `$${livePrice}` : 'Fetching price...'}
              </Typography>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Rewards Section */}
      <Box
        mt={4}
        style={{ display: 'flex', justifyContent: 'space-evenly', width: '100%' }}
      >
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
            <Typography
              variant="body1"
              style={{ color: '#fff', textAlign: 'center' }}
            >
              {period === 'day'
                ? '1 Day'
                : period === 'epoch'
                ? '1 Epoch (5 Days)'
                : period === 'month'
                ? '1 Month'
                : '1 Year'}
            </Typography>
            <Typography
              variant="h6"
              style={{ textAlign: 'center', color: '#fff' }}
            >
              {rewardEstimate && livePrice
                ? `${rewardEstimate[period].min.toFixed(6)} - ${rewardEstimate[
                    period
                  ].max.toFixed(6)} ADA`
                : 'Calculating...'}
            </Typography>
            <Typography
              variant="body2"
              style={{ textAlign: 'center', color: '#fff' }}
            >
              {rewardEstimate && livePrice
                ? `$${(rewardEstimate[period].min * livePrice).toFixed(2)} - $${
                    (rewardEstimate[period].max * livePrice).toFixed(2)
                  } USD`
                : 'Calculating...'}
            </Typography>
          </Paper>
        ))}
      </Box>
    </div>
  );
};

export default Simulator;
