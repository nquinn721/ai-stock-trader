import { Box, Typography } from "@mui/material";
import React from "react";
import { ScanMatch } from "../../types/marketScanner";

interface ScanResultsProps {
  results: ScanMatch[];
  onStockSelect?: (symbol: string) => void;
  loading: boolean;
}

export const ScanResults: React.FC<ScanResultsProps> = ({
  results,
  onStockSelect,
  loading,
}) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Scan Results ({results.length})
      </Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : results.length === 0 ? (
        <Typography color="textSecondary">
          No results found. Run a scan to see matching stocks.
        </Typography>
      ) : (
        <Typography>
          Found {results.length} matching stocks. Full component implementation
          pending.
        </Typography>
      )}
    </Box>
  );
};
