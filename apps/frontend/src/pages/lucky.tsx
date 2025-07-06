import { useState } from "react";
const Wheel = dynamic(
  () => import("react-custom-roulette").then((mod) => mod.Wheel),
  { ssr: false },
);
import { lucky } from "../services/api";
import { Box, Paper, Typography, Button, Alert } from "@mui/material";
import { useRouter } from "next/router";
import { routes } from "@/utils/constants";
import dynamic from "next/dynamic";
const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

const hardcodedLabels = [
  "Double Drink",
  "Half Score",
  "Double Score",
  "Free Choice",
  "Tequila",
  "Beer",
  "Wine",
  "Cider",
  "Cocktail",
  "Spirit w/ Mixer",
  "Guinness",
  "Jägerbomb",
  "VK",
];
const outcomeList = hardcodedLabels.map((label) => ({ option: label }));

export default function LuckyPage() {
  const router = useRouter();
  const [outcomes] = useState(outcomeList);
  const [result, setResult] = useState(null);
  const [hole, setHole] = useState(null);
  const [prizeIndex, setPrizeIndex] = useState(0);
  const [mustSpin, setMustSpin] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSpin = async () => {
    setError(null);
    try {
      const data = await lucky();

      const index = hardcodedLabels.findIndex((label) => label === data.result);

      if (index === -1)
        throw new Error(`Result "${data.result}" not found in outcomes`);

      setPrizeIndex(index);
      setResult(data.result);
      setHole(data.hole);
      requestAnimationFrame(() => setMustSpin(true));
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 409) {
        setError("You have already used your spin.");
        setHasSpun(true);
      } else {
        setError(err.message || "Something went wrong");
      }
    }
  };

  const handleBack = () => {
    router.push(routes.GAME);
  };

  return (
    <Box
      sx={{
        mt: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 3,
        mx: "auto",
        my: 2,
        maxWidth: ".95",
        backgroundColor: "#4a555a",
        borderRadius: 2,
        boxShadow: 5,
        textAlign: "center",
      }}
    >
      <Paper
        sx={{
          p: 4,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: 3,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
          Feeling lucky?
        </Typography>
        <Typography variant="subtitle1" gutterBottom sx={{ color: "#bbbbbb" }}>
          You only get one spin, make it count
        </Typography>
        <Box sx={{ my: 3 }}>
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeIndex}
            data={outcomes}
            backgroundColors={["#389e5c", "#4a555a"]}
            textColors={["#fff"]}
            spinDuration={0.9}
            radiusLineColor="#fff"
            outerBorderColor="#389e5c"
            fontSize={16}
            onStopSpinning={() => {
              setMustSpin(false);
              setHasSpun(true);
            }}
          />
        </Box>

        {hasSpun && result && (
          <div>
            <Typography
              variant="h5"
              sx={{ mt: 4, fontWeight: "bold", color: "primary.main" }}
            >
              You got: {result} for Hole {hole}!
            </Typography>
            <Confetti numberOfPieces={500} recycle={false} />
          </div>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
      <Paper
        sx={{
          mt: 4,
          p: 3,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: 3,
        }}
      >
        <Button
          onClick={handleSpin}
          disabled={
            mustSpin || hasSpun || error === "You have already used your spin."
          }
          variant="contained"
          sx={{ mb: 2, bgcolor: "#389e5c", width: "200px" }}
        >
          Spin the Wheel
        </Button>
        <Button
          variant="outlined"
          onClick={handleBack}
          sx={{ borderColor: "#389e5c", width: "200px" }}
        >
          Back
        </Button>
      </Paper>
    </Box>
  );
}
