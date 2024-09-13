import React, { useState } from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Für die Navigation zur Evaluation
import Question from './Question';
import QuestionOverview from './QuestionOverview';
import '../../styles/App.css';

const questions = [
  'I would support a blockchain system where all users can make decisions equally.',  // Decentralization
  'I would accept a blockchain system controlled by a central authority.',  // Centralization vs Decentralization
  'A high degree of decentralization is more important than fast transaction times.',  // Decentralization vs Scalability
  'The security features of a blockchain system are crucial for my usage.',  // Security
  'The privacy and security of my transactions are more important to me than the cost of using the system.',  // Security vs Adoption
  'I would not take additional steps to enhance the security of my blockchain transactions.',  // Security vs Ease of Use
  'I am willing to accept reduced participation opportunities if it improves the scalability of a blockchain system.',  // Scalability vs Decentralization
  'Scalability should be prioritized to enable global applications of blockchain.',  // Scalability
  'A blockchain system should be able to process large volumes of transactions quickly.',  // Scalability vs Adoption
  'I trust a decentralized system more, even if it is harder to use.',  // Decentralization vs Usability
  'I prefer using a blockchain with low transaction fees, even if it has fewer security guarantees.',  // Adoption vs Security
  'I would prefer a blockchain system that focuses on user adoption and accessibility over complex technical improvements.',  // Adoption
  'Increased adoption of blockchain systems is more important than decentralized governance.',  // Adoption vs Decentralization
  'I prefer to use a highly secure system over one that has high performance.',  // Security vs Scalability
  'A fast, scalable blockchain is more useful to me than one that is governed by the community.',  // Scalability vs Decentralization
  'I believe a higher level of decentralization is critical to the success of blockchain.',  // Decentralization
  'Blockchain systems should primarily focus on user adoption, even if that compromises decentralization.',  // Adoption vs Decentralization
  'I prefer higher security, even if it means increased costs or slower transaction times.',  // Security vs Scalability
  'I think scalability is more important than security for mainstream adoption of blockchain.',  // Scalability vs Security
  'A blockchain’s success should be measured by its number of users and real-world adoption.'  // Adoption
];

const weights = [
  { decentralization: 0.2, scalability: 0, security: 0, adoption: 0 },
  { decentralization: -0.2, scalability: 0, security: 0, adoption: 0 },
  { decentralization: 0.2, scalability: -0.2, security: 0, adoption: 0 },
  { decentralization: 0, scalability: 0, security: 0.2, adoption: 0 },
  { decentralization: 0, scalability: 0, security: 0.2, adoption: 0.2 },
  { decentralization: 0, scalability: 0, security: -0.2, adoption: 0 },
  { decentralization: 0, scalability: 0.2, security: 0, adoption: -0.2 },
  { decentralization: 0, scalability: 0.2, security: 0, adoption: 0.2 },
  { decentralization: 0, scalability: 0.2, security: 0, adoption: 0 },
  { decentralization: 0.2, scalability: 0, security: 0, adoption: -0.2 },
  { decentralization: 0.1, scalability: 0.1, security: 0, adoption: 0 },
  { decentralization: 0, scalability: 0.1, security: 0.1, adoption: 0 },
  { decentralization: 0, scalability: 0, security: 0.1, adoption: 0.1 },
  { decentralization: 0.1, scalability: 0, security: 0, adoption: 0.1 },
  { decentralization: -0.1, scalability: -0.1, security: 0, adoption: 0 },
  { decentralization: 0, scalability: -0.1, security: -0.1, adoption: 0 },
  { decentralization: 0, scalability: 0, security: -0.1, adoption: -0.1 },
  { decentralization: -0.1, scalability: 0, security: 0, adoption: -0.1 },
  { decentralization: 0.1, scalability: 0, security: 0.1, adoption: -0.1 },
  { decentralization: -0.1, scalability: 0.1, security: -0.1, adoption: 0 },
];

const Questionnaire = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [scores, setScores] = useState({ decentralization: 0, scalability: 0, security: 0, adoption: 0 });
  const navigate = useNavigate(); // Für Navigation zur Evaluation

  const startQuestionnaire = () => {
    setCurrentQuestionIndex(0);
  };

  const handleAnswer = (index, answer, weight) => {
    const newAnswers = [...answers];
    newAnswers[index] = answer;
    setAnswers(newAnswers);

    const newScores = { ...scores };
    // "Neutral" (0) und "Skip" (null) haben jetzt die gleiche Wirkung
    if (answer === 1) {
      newScores.decentralization += weight.decentralization;
      newScores.scalability += weight.scalability;
      newScores.security += weight.security;
      newScores.adoption += weight.adoption;
    } else if (answer === -1) {
      newScores.decentralization -= weight.decentralization;
      newScores.scalability -= weight.scalability;
      newScores.security -= weight.security;
      newScores.adoption -= weight.adoption;
    }
    setScores(newScores);

    // Neue Logik: Nächste Frage oder Evaluation
    const nextHigherIndex = newAnswers.slice(index + 1).findIndex(answer => answer === null);
    if (nextHigherIndex !== -1) {
      setCurrentQuestionIndex(index + nextHigherIndex + 1);
    } else {
      const nextIndex = newAnswers.findIndex(answer => answer === null);
      if (nextIndex !== -1) {
        setCurrentQuestionIndex(nextIndex);
      } else {
        navigate('/evaluation', { state: { scores: newScores } });
      }
    }
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #43cea2, #185a9d)', // Correct gradient direction (top-left to bottom-right)
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <Container maxWidth="lg" sx={{ textAlign: 'center', color: 'black' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'black' }}>
          Questionnaire
        </Typography>
        {currentQuestionIndex === -1 ? (
          <Box sx={{ maxWidth: '800px', margin: '0 auto' }}> {/* Begrenze die Breite für die Beschreibung */}
            <Typography variant="h6" gutterBottom style={{ color: 'black', textAlign: 'justify' }}>
              The questionnaire is designed to capture user preferences across four dimensions: Scalability, Security, Decentralization (the Blockchain Trilemma), and Adoption, which is a crucial factor for Cardano.
              Through 20 questions, the survey identifies user settings and preferences, creating a profile represented by a color code that reflects individual attitudes toward each dimension as well as an overall impression.
              In the future, it will be possible to compare your preferences with those of votes, DReps, or other users to gain better contextual insights.
              The questionnaire and its evaluation do not claim to be scientifically comprehensive or to encompass all aspects fully; rather, they aim to highlight basic attitudes and tendencies.
            </Typography>
            <Button variant="contained" sx={{ backgroundColor: '#424242', marginTop: '20px', color: '#fff' }} onClick={startQuestionnaire}>
              Start Questionnaire
            </Button>
          </Box>
        ) : (
          <Box>
            <Question
              question={questions[currentQuestionIndex]}
              index={currentQuestionIndex}
              onAnswer={handleAnswer}
              weight={weights[currentQuestionIndex]}
            />
            <Box sx={{ marginTop: '40px' }}>
              <QuestionOverview current={currentQuestionIndex} total={questions.length} onNavigate={setCurrentQuestionIndex} answers={answers} />
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Questionnaire;
