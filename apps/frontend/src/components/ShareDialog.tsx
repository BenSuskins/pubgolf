import { FC, useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Typography, Button, IconButton, Box, Snackbar, Alert } from '@mui/material';
import IosShareIcon from '@mui/icons-material/IosShare';
import CloseIcon from '@mui/icons-material/Close';
import QRCode from "react-qr-code";
import { getShareLink, capitalizeGameIdentifier } from '@/utils/utils';

const ShareDialog: FC<ShareDialogProps> = ({ open, onClose, title, gameIdentifier, buttonText }) => {
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const handleCopyToClipboard = () => {
        const shareLink = getShareLink();
        if (shareLink) {
            navigator.clipboard.writeText(shareLink).then(() => {
                setOpenSnackbar(true);
            }, (err) => {
                console.error('Could not copy text: ', err);
            });
        }
    };

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    return (
        <>
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>
                    {title}
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <DialogContentText>
                        Share this link to invite others:
                    </DialogContentText>
                    <Typography variant="h6" sx={{ mt: 1, bgcolor: 'background.paper', borderRadius: 1, textAlign: 'center', wordBreak: 'break-all' }}>
                        {`${capitalizeGameIdentifier(gameIdentifier)}`}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <QRCode size={256}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            value={getShareLink()}
                            bgColor="#3b454a"
                            fgColor="#FFF"
                            viewBox={`0 0 256 256`} />
                    </Box>
                    <Button
                        onClick={handleCopyToClipboard}
                        variant="outlined"
                        color="primary"
                        startIcon={<IosShareIcon />}
                        sx={{ mt: 2 }}
                        fullWidth
                    >
                        Share invite
                    </Button>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center' }}>
                    <Button variant="contained" fullWidth onClick={onClose} color="primary">
                        {buttonText}
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity="success" variant="filled" sx={{ width: '100%' }}>
                    Game invite copied to clipboard
                </Alert>
            </Snackbar>
        </>
    );
};

export default ShareDialog;