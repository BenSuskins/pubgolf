import React from 'react';
import { styled } from '@mui/system';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar } from '@mui/material';
import { drinks } from '@/utils/constants';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    zIndex: 2,
}));

const StickyTableCell = styled(TableCell)(({ theme }) => ({
    position: 'sticky',
    left: 0,
    backgroundColor: theme.palette.background.paper,
    zIndex: 1,
    fontWeight: 'bold',
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:hover': {
        backgroundColor: theme.palette.action.selected,
    },
}));

const getScoreColor = (score: number, par: number): string => {
    if (score > par) {
        return '#f44336';
    }
    return '#fff';
};

function stringAvatar(name: string) {
    const nameParts = name.split(' ');
    const initials = nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts[1][0]}`
        : `${Array.from(name)[0].toUpperCase()}`;

    return {
        sx: {
            mr: 2
        },
        children: initials,
    };
}

const ScoreboardTable: React.FC<ScoreboardTableProps> = ({ players }) => {
    return (
        <TableContainer component={Paper} sx={{ overflowX: 'auto', mt: 2, boxShadow: 3 }}>
            <Table stickyHeader aria-label="scoreboard table">
                <TableHead>
                    <TableRow>
                        <StyledTableCell
                            sx={{
                                position: 'sticky',
                                left: 0,
                                zIndex: 2,
                                width: 200,
                            }}>
                            Name
                        </StyledTableCell>
                        {drinks.map((_, index) => (
                            <StyledTableCell
                                sx={{
                                    zIndex: 1
                                }}
                                key={index} align="right">Hole {index + 1}</StyledTableCell>
                        ))}
                        <StyledTableCell
                            sx={{
                                zIndex: 1
                            }}
                            align="right">Total</StyledTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {players.map((player, index) => (
                        <StyledTableRow key={index}>
                            <StickyTableCell
                                sx={{
                                    zIndex: 1
                                }}
                                component="th"
                                scope="row"
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar {...stringAvatar(player.name)} />
                                    {player.name}
                                </Box>
                            </StickyTableCell>
                            {player.scores.map((score, i) => (
                                <TableCell key={i} align="right" sx={{ color: getScoreColor(score, drinks[i].par) }}>
                                    {score}
                                </TableCell>
                            ))}
                            <TableCell align="right">{player.totalScore}</TableCell>
                        </StyledTableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};


export default ScoreboardTable;