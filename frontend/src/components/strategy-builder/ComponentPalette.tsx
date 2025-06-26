import { ExpandMore, Search } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import { ComponentLibrary } from "./StrategyBuilder";

interface ComponentPaletteProps {
  components: ComponentLibrary;
  onDragStart: (component: any) => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  components,
  onDragStart,
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filterComponents = (componentList: any[]) => {
    if (!searchTerm) return componentList;
    return componentList.filter(
      (component) =>
        component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleDragStart = (e: React.DragEvent, component: any) => {
    e.dataTransfer.setData("application/json", JSON.stringify(component));
    e.dataTransfer.effectAllowed = "copy";
    onDragStart(component);
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case "sma":
      case "ema":
        return "📈";
      case "rsi":
        return "🔄";
      case "macd":
        return "📉";
      case "bollinger":
        return "�";
      case "buy_market":
      case "buy_limit":
        return "🛒";
      case "sell_market":
      case "sell_limit":
        return "💰";
      case "stop_loss":
        return "🛑";
      case "take_profit":
        return "�";
      case "price_above":
        return "⬆️";
      case "price_below":
        return "⬇️";
      case "crossover":
      case "crossunder":
        return "✂️";
      default:
        return "⚙️";
    }
  };

  const categories = [
    {
      key: "indicators",
      label: "Technical Indicators",
      items: components.indicators,
    },
    { key: "conditions", label: "Conditions", items: components.conditions },
    { key: "actions", label: "Trading Actions", items: components.actions },
    { key: "riskRules", label: "Risk Management", items: components.riskRules },
  ];

  return (
    <Box sx={{ height: "100%", overflow: "auto" }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6" gutterBottom>
          Components
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ p: 1 }}>
        {categories.map((category) => {
          const filteredItems = filterComponents(category.items);
          if (filteredItems.length === 0) return null;

          return (
            <Accordion key={category.key} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2">
                  {category.label} ({filteredItems.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List dense>
                  {filteredItems.map((component) => (
                    <ListItem
                      key={component.id}
                      sx={{
                        cursor: "grab",
                        "&:hover": {
                          backgroundColor: "action.hover",
                        },
                        borderRadius: 1,
                        mb: 0.5,
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, component)}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Typography sx={{ fontSize: "1.2em" }}>
                          {getComponentIcon(component.id)}
                        </Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary={component.name}
                        secondary={component.description}
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: 500,
                        }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
};
