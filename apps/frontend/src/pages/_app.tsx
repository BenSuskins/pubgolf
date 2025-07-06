import { useMemo, useState, useEffect } from "react";
import {
  ThemeProvider,
  CssBaseline,
  Typography,
  Link,
  Box,
} from "@mui/material";
import theme from "../theme";
import type { AppProps } from "next/app";
import Head from "next/head";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>Pub Golf</title>
      </Head>
      <CssBaseline />
      <Component {...pageProps} />
      <footer>
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{ color: "#808080" }}
          >
            © 2025 Ben Suskins | Pub Golf <br></br>
            <Link href="/terms">Terms & Conditions</Link> ·{" "}
            <Link href="/privacy">Privacy Policy</Link> ·{" "}
            <Link
              href="https://github.com/BenSuskins/pubgolf/issues/new/choose"
              target="_blank"
              rel="noopener noreferrer"
            >
              Report an issue
            </Link>
          </Typography>
        </Box>
      </footer>
    </ThemeProvider>
  );
}

export default MyApp;
