import { useMemo, useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '../theme';
import type { AppProps } from 'next/app';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>Pub Golf</title>
      </Head>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
