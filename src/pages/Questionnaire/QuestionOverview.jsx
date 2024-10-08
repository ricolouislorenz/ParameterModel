import React from 'react';
import { Box, Button } from '@mui/material';
import PropTypes from 'prop-types';

const QuestionOverview = ({ current, total, onNavigate, answers }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
      {[...Array(total).keys()].map((index) => (
        <Button
          key={index}
          onClick={() => onNavigate(index)}
          sx={{
            backgroundColor: current === index ? '#007BFF' : answers[index] !== null ? '#424242' : 'white',
            color: current === index ? 'white' : answers[index] !== null ? 'white' : 'black',
            minWidth: '40px',
            margin: '5px',
            padding: '10px',
            '&:hover': {
              backgroundColor: current === index ? '#007BFF' : answers[index] !== null ? '#616161' : 'lightgrey',
            },
          }}
        >
          {index + 1}
        </Button>
      ))}
    </Box>
  );
};

QuestionOverview.propTypes = {
  current: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onNavigate: PropTypes.func.isRequired,
  answers: PropTypes.arrayOf(PropTypes.any).isRequired,
};

export default QuestionOverview;
