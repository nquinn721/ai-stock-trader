import { AppBar, Toolbar, Typography } from "@mui/material";
import React from "react";

const Header: React.FC = () => {
  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Project Management Dashboard
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
