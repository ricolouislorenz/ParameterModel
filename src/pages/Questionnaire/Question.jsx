// src/pages/Questionnaire/Question.jsx

import React, { useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import PropTypes from 'prop-types';
import '../../styles/App.css';

const Question = ({ question, index, onAnswer, weight }) => {
  useEffect(() => {
    console.log(`Rendering question ${index + 1}: ${question}`);
  }, [question, index]);

  const handleAnswer = (answer) => {
    onAnswer(index, answer, weight);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        padding: '60px',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'black',
        width: '100%',
        border: '5px solid #fff', // Weißer Rahmen
        borderRadius: '15px', // Abgerundete Ecken
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Leicht transparentes Weiß
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Schatteneffekt
        textAlign: 'center',
      }}
    >
      <Typography variant="h6" gutterBottom>
        {question}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="contained"
          sx={{ backgroundColor: '#424242', color: '#fff', minWidth: '120px' }}
          onClick={() => handleAnswer(1)}
        >
          Agree
        </Button>
        <Button
          variant="contained"
          sx={{ backgroundColor: '#424242', color: '#fff', minWidth: '120px' }}
          onClick={() => handleAnswer(0)}
        >
          Neutral
        </Button>
        <Button
          variant="contained"
          sx={{ backgroundColor: '#424242', color: '#fff', minWidth: '120px' }}
          onClick={() => handleAnswer(-1)}
        >
          Disagree
        </Button>
        <Button
          variant="contained"
          sx={{ backgroundColor: '#424242', color: '#fff', minWidth: '120px' }}
          onClick={() => handleAnswer(null)}
        >
          Skip
        </Button>
      </Box>
    </Box>
  );
};

Question.propTypes = {
  question: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  onAnswer: PropTypes.func.isRequired,
  weight: PropTypes.object.isRequired,
};

export default Question;
