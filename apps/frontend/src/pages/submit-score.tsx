import { useRouter } from 'next/router';
import { useState } from 'react';
import { Box, Button, TextField, Typography, MenuItem, FormControl, InputLabel, Select, Paper } from '@mui/material';
import { submitScore } from '@/services/api';
import { routes } from '@/utils/constants';

const SubmitScorePage = () => {
    const router = useRouter();
    const [hole, setHole] = useState('');
    const [score, setScore] = useState('');
    const [error, setError] = useState('');

    const validateScore = (score: string) => {
        const numScore = parseInt(score);
        if (numScore < -10 || numScore > 10) {
            setError('Score must be between -10 and 10.');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validateScore(score)) {
            return;
        }

        try {
            await submitScore(parseInt(hole), parseInt(score));
            handleBack();
        } catch (error) {
            console.error('Failed to submit score:', error);
            setError('Failed to submit score.');
        }
    };

    const handleBack = () => {
        router.push(routes.GAME);
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
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
            textAlign: 'center'
        }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#fff', mb: 2 }}>
                Submit Your Score
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="hole-label">Hole</InputLabel>
                <Select
                    labelId="hole-label"
                    id="hole"
                    value={hole}
                    label="Hole"
                    onChange={(e) => setHole(e.target.value)}
                    sx={{ borderRadius: 1 }}
                >
                    {Array.from({ length: 9 }, (_, i) => (
                        <MenuItem key={i} value={i + 1}>Hole {i + 1}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TextField
                required
                fullWidth
                id="score"
                label="Score"
                name="score"
                type="number"
                autoComplete="score"
                margin="normal"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                error={!!error}
                helperText={error}
                sx={{ mb: 2, borderRadius: 1 }}
            />
            <Paper sx={{ mt: 4, p: 3, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 3 }}>
                <Button
                    type="submit"
                    variant="contained"
                    sx={{ mb: 2, bgcolor: '#389e5c', width: '200px' }}
                >
                    Submit
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleBack}
                    sx={{ borderColor: '#389e5c', width: '200px' }}
                >
                    Back
                </Button>
            </Paper>
        </Box>
    );
};

export default SubmitScorePage;