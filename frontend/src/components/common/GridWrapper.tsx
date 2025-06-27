import React from 'react';
import { Box, BoxProps } from '@mui/material';

interface GridProps extends Omit<BoxProps, 'children'> {
  container?: boolean;
  item?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  spacing?: number;
  children?: React.ReactNode;
}

export const Grid: React.FC<GridProps> = ({
  container = false,
  item = false,
  xs,
  sm,
  md,
  lg,
  xl,
  spacing,
  children,
  sx,
  ...rest
}) => {
  // Container styles
  if (container) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: spacing ? `${spacing * 8}px` : '16px',
          ...sx,
        }}
        {...rest}
      >
        {children}
      </Box>
    );
  }

  // Item styles
  if (item) {
    const gridColumn = xs ? `span ${xs}` : 'span 12';
    
    return (
      <Box
        sx={{
          gridColumn: {
            xs: xs ? `span ${xs}` : 'span 12',
            sm: sm ? `span ${sm}` : undefined,
            md: md ? `span ${md}` : undefined,
            lg: lg ? `span ${lg}` : undefined,
            xl: xl ? `span ${xl}` : undefined,
          },
          ...sx,
        }}
        {...rest}
      >
        {children}
      </Box>
    );
  }

  // Regular Box
  return (
    <Box sx={sx} {...rest}>
      {children}
    </Box>
  );
};

export default Grid;
