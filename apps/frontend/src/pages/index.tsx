import type { NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { Box, Typography, Paper, useMediaQuery, useTheme, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, IconButton, Link } from '@mui/material';
import CreateGameForm from '../components/CreateGameForm';
import JoinGameForm from '../components/JoinGameForm';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { getPlayers } from '@/services/api'; // Make sure this path is correct
import { getPlayerName } from '@/utils/utils';

const Home: NextPage = () => {
  const router = useRouter();
  const { identifier } = router.query;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const checkExistingGame = async () => {
      try {
        const playersData = await getPlayers();
        if (playersData.length > 0 && getPlayerName()) {
          setOpenDialog(true);
        }
      } catch (error) {
        console.debug('Failed to fetch players during initial load:', error);
      }
    };

    checkExistingGame();
  }, []);

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleRejoinGame = () => {
    router.push('/game');
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3, textAlign: 'center' }}>
      <Head>
        <title>Welcome to Pub Golf</title>
      </Head>
      <Box sx={{
        mt: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 3,
        mx: 'auto',
        my: 2,
        maxWidth: '1000px',
        backgroundColor: '#4a555a', // Dark background to match the theme
        borderRadius: 2,
        boxShadow: 5,
      }}>
        <Typography variant="h2" gutterBottom component="h1">
          Welcome to Pub Golf!
        </Typography>
        <Typography variant="subtitle1" gutterBottom sx={{ color: '#bbbbbb' }}>
          Pub Golf is a fun, social game that combines the challenge of golf scoring with the enjoyment of visiting your favorite pubs. Join a game or create a new one to start your adventure!
        </Typography>
        <Box sx={{ my: 4 }}>
          <Image
            src="/homepage.png"
            alt="Pub Golf"
            width={isMobile ? 300 : 500}
            height={isMobile ? 300 : 500}
          />
        </Box>
        <Typography variant="subtitle1" gutterBottom sx={{ color: '#bbbbbb' }}>
          To get started, create a new game or join an existing game by entering the game identifier below.
        </Typography>
        <Paper sx={{ mt: 4, p: 3, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 3 }}>
          <CreateGameForm />
          <JoinGameForm gameIdentifier={identifier as string} />
        </Paper>
      </Box>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          It looks like you&apos;ve already joined a game
        </DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Do you want to rejoin?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button variant="outlined" fullWidth onClick={handleCloseDialog} color="primary">
            No
          </Button>
          <Button variant="contained" fullWidth onClick={handleRejoinGame} color="primary">
            Yes
          </Button>
        </DialogActions>
      </Dialog>
      <Typography variant="subtitle1" gutterBottom sx={{ color: '#bbbbbb' }}>
          Run into an issue? Report it <Link href="https://github.com/BenSuskins/pubgolf/issues/new/choose" target="_blank" rel="noopener noreferrer">here</Link>.
        </Typography>
    </Box>
  );
};

export default Home;