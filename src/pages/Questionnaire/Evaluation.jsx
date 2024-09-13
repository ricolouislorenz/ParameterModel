import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Container, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import userBack from '../../assets/images/userBack.png';
import user from '../../assets/images/user.png';

const colorRanges = {
  decentralization: ['#FF0000', '#00FF00'],
  scalability: ['#0000FF', '#FFFF00'],
  security: ['#00FFFF', '#FF00FF'],
  adoption: ['#FFA500', '#800080'],
};

const calculateColor = (score, minColor, maxColor) => {
  const mix = (color1, color2, weight) => {
    const d2h = (d) => d.toString(16).padStart(2, '0');
    const h2d = (h) => parseInt(h, 16);
    const col1 = color1.slice(1).match(/.{2}/g).map(h2d);
    const col2 = color2.slice(1).match(/.{2}/g).map(h2d);
    const result = col1.map((c1, i) => d2h(Math.floor(c1 + (col2[i] - c1) * weight)));
    return `#${result.join('')}`;
  };

  return mix(minColor, maxColor, (score + 1) / 2);
};

const combineColors = (colors) => {
  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  const rgbToHex = (r, g, b) => {
    const toHex = (c) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const totalRgb = colors.reduce(
    (acc, color) => {
      const [r, g, b] = hexToRgb(color);
      return [acc[0] + r, acc[1] + g, acc[2] + b];
    },
    [0, 0, 0]
  );

  const averageRgb = totalRgb.map((c) => Math.floor(c / colors.length));
  return rgbToHex(averageRgb[0], averageRgb[1], averageRgb[2]);
};

const Evaluation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const scores = location.state?.scores || { decentralization: 0, scalability: 0, security: 0, adoption: 0 };

  useEffect(() => {
    console.log('Scores received for evaluation:', scores);
  }, [scores]);

  const decentralizationColor = calculateColor(scores.decentralization, ...colorRanges.decentralization);
  const scalabilityColor = calculateColor(scores.scalability, ...colorRanges.scalability);
  const securityColor = calculateColor(scores.security, ...colorRanges.security);
  const adoptionColor = calculateColor(scores.adoption, ...colorRanges.adoption);

  const overallColor = combineColors([
    decentralizationColor,
    scalabilityColor,
    securityColor,
    adoptionColor,
  ]);

  const handleColorClick = () => {
    navigator.clipboard.writeText(overallColor);
    console.log(`Copied ${overallColor} to clipboard`);
  };

  return (
    <Box
      sx={{
        backgroundImage: `url(${userBack})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        padding: '20px',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(45deg, #ffa751, #846c9e)',
      }}
    >
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Left Section: Stats and Labels */}
        <Box
          sx={{
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',  // Higher position
            textAlign: 'left',
            gap: 3,
          }}
        >
          <Typography variant="h4" sx={{ color: 'white', mb: 3, textAlign: 'center' }}>
            Your Results
          </Typography>

          {['Decentralization', 'Scalability', 'Security', 'Adoption'].map((label, idx) => {
            const score = scores[label.toLowerCase()];
            const barColor = calculateColor(score, ...colorRanges[label.toLowerCase()]);
            return (
              <Box key={idx} sx={{ marginBottom: '20px' }}>
                <Typography variant="h6" sx={{ color: 'white', textAlign: 'left', mb: 1 }}>
                  {label}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: '40px',
                    background: '#3a3a3a', // Gray background to improve contrast
                    borderRadius: '10px',
                    border: '2px solid #ffffff',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(to right, ${colorRanges[label.toLowerCase()][0]}, ${colorRanges[label.toLowerCase()][1]})`,
                      position: 'absolute',
                      borderRadius: '10px',
                    }}
                  />
                  <Box
                    sx={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: barColor,
                      borderRadius: '50%',
                      position: 'absolute',
                      left: `${(score + 1) * 50}%`,
                      border: '3px solid white',
                      transition: 'left 0.3s ease-in-out',
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Right Section: User Avatar */}
        <Box sx={{ width: '45%', textAlign: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-block', width: '65%' }}> {/* Smaller Image */}
            <img src={user} alt="User Avatar" style={{ width: '100%', zIndex: 1, position: 'relative' }} />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: overallColor,
                borderRadius: '10px',
                zIndex: 0,
              }}
            />
          </Box>
          <Typography
            variant="body1"
            sx={{ mt: 2, color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.2rem' }}
            onClick={handleColorClick}
          >
            {overallColor}
          </Typography>
          <Typography variant="caption" sx={{ color: 'white', fontStyle: 'italic' }}>
            Click to copy your color code
          </Typography>

          {/* Action Buttons */}
          <Box sx={{ mt: 4 }}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/questionnaire')}
            >
              Reset to Start
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

Evaluation.propTypes = {
  scores: PropTypes.object.isRequired,
};

export default Evaluation;
