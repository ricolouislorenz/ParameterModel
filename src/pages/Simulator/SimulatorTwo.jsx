import React, { useState, useEffect } from 'react';
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

const SimulatorTwo = () => {
  // State variables for raw input values
  const [rhoInput, setRhoInput] = useState('0,003');
  const [tauInput, setTauInput] = useState('0,2');
  const [thetaInput, setThetaInput] = useState('0,8');
  const [feesInput, setFeesInput] = useState('0,05'); // Fees as a percentage

  // Parsed numeric values
  const [rho, setRho] = useState(0.003); // Monetary expansion parameter
  const [tau, setTau] = useState(0.2);   // Treasury growth parameter
  const [theta, setTheta] = useState(0.8); // Participation parameter
  const [fees, setFees] = useState(0.05); // Fees as a percentage (e.g., 5%)

  const [chartType, setChartType] = useState('reserve'); // Default chart view
  const [projections, setProjections] = useState([]); // Projections data
  const [scenario, setScenario] = useState('neutral'); // Scenario: 'positive', 'neutral', 'negative'
  const navigate = useNavigate();

  // Initial values
  const initialReserve = 14000000000; // Initial reserve in ADA
  const initialTreasury = 0; // Initial treasury amount

  // Function to reset parameters to default
  const resetParams = () => {
    setRho(0.003);
    setRhoInput('0,003');
    setTau(0.2);
    setTauInput('0,2');
    setTheta(0.8);
    setThetaInput('0,8');
    setFees(0.05);
    setFeesInput('0,05');
    setScenario('neutral');
  };

  // Function to apply scenario presets
  const applyScenario = (scenario) => {
    setScenario(scenario);
    if (scenario === 'positive') {
      setRho(0.005);
      setRhoInput('0,005');
      setTau(0.15);
      setTauInput('0,15');
      setTheta(0.9);
      setThetaInput('0,9');
      setFees(0.07);
      setFeesInput('0,07');
    } else if (scenario === 'negative') {
      setRho(0.002);
      setRhoInput('0,002');
      setTau(0.25);
      setTauInput('0,25');
      setTheta(0.7);
      setThetaInput('0,7');
      setFees(0.03);
      setFeesInput('0,03');
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

      // Calculate fees as a percentage of total rewards
      const feesAmount = (rho * eta * currentReserve) * fees;

      // Calculate total rewards after treasury cut and fees
      const totalRewards = ((rho * eta * currentReserve) - feesAmount) * (1 - tau);

      // Update treasury with its share of rewards
      currentTreasury += tau * (rho * eta * currentReserve);

      // Record projections
      projections.push({
        epoch: i + 1,
        date: new Date(Date.now() + i * 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        reserve: currentReserve,
        treasury: currentTreasury,
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
    let value = feesInput.replace(',', '.');
    let parsedValue = parseFloat(value);
    if (!isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 1) {
      parsedValue = parseFloat(parsedValue.toFixed(5));
      setFees(parsedValue);
    }
  }, [feesInput]);

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

  // Icon button styles
  const iconButtonStyle = {
    color: '#fff',
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
          Compare historical and future projections for Rewards, Reserve, and Treasury.
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
                    setRho,
                    0,
                    0.01,
                    0.001,
                    5
                  )}
                  placeholder="0,003"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputLabelProps={{ style: { color: '#fff' } }}
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
                    setTau,
                    0,
                    1,
                    0.1,
                    5
                  )}
                  placeholder="0,2"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputLabelProps={{ style: { color: '#fff' } }}
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
                    setTheta,
                    0,
                    1,
                    0.1,
                    5
                  )}
                  placeholder="0,8"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputLabelProps={{ style: { color: '#fff' } }}
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
                />
              </Tooltip>

              <Tooltip
                title="Fees as a percentage of total rewards (min 0, max 1)."
                arrow
              >
                <TextField
                  type="text"
                  label="Fees Percentage"
                  value={feesInput}
                  onChange={handleInputChange(setFeesInput)}
                  onBlur={handleBlur(
                    feesInput,
                    setFeesInput,
                    setFees,
                    0,
                    1,
                    0.01,
                    5
                  )}
                  placeholder="0,05"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                  InputLabelProps={{ style: { color: '#fff' } }}
                  InputProps={{
                    style: { color: '#fff' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={decrementValue(
                            fees,
                            setFees,
                            setFeesInput,
                            0,
                            0.01,
                            5
                          )}
                          size="small"
                          style={iconButtonStyle}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <IconButton
                          onClick={incrementValue(
                            fees,
                            setFees,
                            setFeesInput,
                            1,
                            0.01,
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
