import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button, Paper, Snackbar, IconButton, Alert } from '@mui/material';
import { getPlayers } from '../services/api';
import { getGameIdentifier } from '@/utils/utils';
import ScoreboardTable from '../components/ScoreboardTable';
import { routes } from '@/utils/constants';
import ShareIcon from '@mui/icons-material/Share';
import ShareDialog from '../components/ShareDialog';
import { capitalizeGameIdentifier } from '@/utils/utils';

interface Player {
    name: string;
    scores: number[];
    totalScore: number;
}

const GamePage = () => {
    const router = useRouter();
    const [players, setPlayers] = useState<Player[]>([]);
    const [gameIdentifier, setGameIdentifier] = useState('');
    const [showDialog, setShowDialog] = useState(false);

    const fetchPlayers = async () => {
        try {
            const playersData = await getPlayers();
            setPlayers(playersData.players);
        } catch (error) {
            console.error('Failed load players:', error);
        }
    };

    const fetchGameIdentifier = async () => {
        const identifier = getGameIdentifier();
        setGameIdentifier(identifier);
    };

    const handleScoreSubmit = () => {
        router.push(routes.SUBMIT);
    };

    const handleHowToPlay = () => {
        router.push(routes.RULES);
    };

    const handleShare = () => {
        setShowDialog(true);
    };

    const handleCloseDialog = () => {
        setShowDialog(false);
    };

    useEffect(() => {
        fetchPlayers();
        getGameIdentifier();
        const interval = setInterval(fetchPlayers, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchGameIdentifier();
    }, []);

    return (
        <Box sx={{
            mt: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 3,
            mx: 'auto',
            my: 2,
            maxWidth: '.95',
            backgroundColor: '#4a555a',
            borderRadius: 2,
            boxShadow: 5,
        }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                Scores
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#bbbbbb' }}>
                    <em>Game - {capitalizeGameIdentifier(gameIdentifier)}</em>
                </Typography>
                <IconButton onClick={handleShare} color="primary" size="small" sx={{ mt: -.6 }}>
                    <ShareIcon />
                </IconButton>
            </Box>
            <ScoreboardTable players={players} />
            <Paper sx={{ mt: 4, p: 3, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 3 }}>
                <Button
                    variant="contained"
                    sx={{ mb: 2, bgcolor: '#389e5c', '&:hover': { bgcolor: '#45a049' }, width: '200px' }}
                    onClick={handleScoreSubmit}
                >
                    Submit Score
                </Button>
                <Button
                    variant="contained"
                    sx={{ bgcolor: '#389e5c', '&:hover': { bgcolor: '#45a049' }, width: '200px' }}
                    onClick={handleHowToPlay}
                >
                    How to Play
                </Button>
            </Paper>
            <ShareDialog
                open={showDialog}
                onClose={handleCloseDialog}
                title="Share Game"
                gameIdentifier={gameIdentifier}
                buttonText='Close'
            />
        </Box>
    );
};

export default GamePage;