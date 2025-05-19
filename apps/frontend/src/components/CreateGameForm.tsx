import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button, TextField, Box, Collapse, Typography, Alert } from '@mui/material';
import { createGame, joinGame } from '@/services/api';
import { routes } from '@/utils/constants';
import ShareDialog from './ShareDialog';

const CreateGameForm = () => {
  const [name, setName] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [gameIdentifier, setGameIdentifier] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleCreateGame = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (!validateName(name)) {
        return;
      }
      const game = await createGame(name);
      setGameIdentifier(game.gameCode)
      setShowDialog(true);
    } catch (error) {
      console.error('Failed to create and join game:', error);
    }
  };

  const validateName = (name: string) => {
    if (name.length < 2) {
      setErrorMessage('Name must be greater than 2 characters.');
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const toggleFormVisibility = () => {
    setShowForm(!showForm);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    router.push(routes.GAME);
  };

  return (
    <Box sx={{ mt: 0 }}>
      <ShareDialog
        open={showDialog}
        onClose={handleCloseDialog}
        title="Game Created"
        gameIdentifier={gameIdentifier}
        buttonText='Play!'
      />
      <Button
        type="submit"
        onClick={toggleFormVisibility}
        variant={showForm ? 'outlined' : 'contained'}
        color="primary"
        sx={{ width: '200px' }}
      >
        {showForm ? 'Back' : 'Create Game'}
      </Button>
      <Collapse in={showForm}>
        <Box component="form" onSubmit={handleCreateGame} noValidate sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <TextField
            margin="normal"
            required
            id="name"
            label="Your Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ borderRadius: 1, width: '300px' }}
            error={!!errorMessage}
            helperText={errorMessage}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 3, width: '200px' }}
          >
            Create
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
};

export default CreateGameForm;