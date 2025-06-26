import { Delete, AddCircle, RemoveCircle, GridOn, GridOff, ZoomIn, ZoomOut, CenterFocusStrong } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography, Tooltip } from "@mui/material";
import React, { useCallback, useRef, useState } from "react";
import {
  ComponentDefinition,
  StrategyComponent,
  StrategyConfig,
} from "./StrategyBuilder";

interface StrategyCanvasProps {
  strategy: StrategyConfig;
  onDrop: (
    component: ComponentDefinition,
    position: { x: number; y: number }
  ) => void;
  onConnect: (fromId: string, toId: string) => void;
  onComponentUpdate: (
    componentId: string,
    updates: Partial<StrategyComponent>
  ) => void;
  onComponentDelete: (componentId: string) => void;
}

export const StrategyCanvas: React.FC<StrategyCanvasProps> = ({
  strategy,
  onDrop,
  onConnect,
  onComponentUpdate,
  onComponentDelete,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectionMode, setConnectionMode] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [tempConnection, setTempConnection] = useState<{
    from: string;
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize] = useState(20);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(new Set());

  const centerCanvas = useCallback(() => {
    if (strategy.components.length === 0) return;
    
    // Calculate center of all components
    const bounds = strategy.components.reduce(
      (acc, comp) => {
        if (!comp.position) return acc;
        return {
          minX: Math.min(acc.minX, comp.position.x),
          minY: Math.min(acc.minY, comp.position.y),
          maxX: Math.max(acc.maxX, comp.position.x + 220),
          maxY: Math.max(acc.maxY, comp.position.y + 120),
        };
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );
    
    // For now, just reset zoom - in a real implementation you'd scroll to center
    setZoom(1);
  }, [strategy.components]);

  const snapToGridPosition = useCallback((x: number, y: number) => {
    if (!snapToGrid) return { x, y };
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }, [snapToGrid, gridSize]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!canvasRef.current) return;

      try {
        const componentData = JSON.parse(
          e.dataTransfer.getData("application/json")
        );
        const rect = canvasRef.current.getBoundingClientRect();
        const rawPosition = {
          x: e.clientX - rect.left - 110, // Center the component
          y: e.clientY - rect.top - 60,
        };
        
        const position = snapToGridPosition(
          Math.max(0, rawPosition.x),
          Math.max(0, rawPosition.y)
        );

        onDrop(componentData, position);
      } catch (error) {
        console.error("Error parsing dropped component:", error);
      }
    },
    [onDrop]
  );

  const handleComponentMouseDown = useCallback(
    (e: React.MouseEvent, componentId: string) => {
      e.preventDefault();
      const component = strategy.components.find((c) => c.id === componentId);
      if (!component || !component.position || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - component.position.x;
      const offsetY = e.clientY - rect.top - component.position.y;

      setDraggedComponent(componentId);
      setDragOffset({ x: offsetX, y: offsetY });
    },
    [strategy.components]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggedComponent && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const rawX = e.clientX - rect.left - dragOffset.x;
        const rawY = e.clientY - rect.top - dragOffset.y;
        
        const snappedPosition = snapToGridPosition(
          Math.max(0, rawX),
          Math.max(0, rawY)
        );

        onComponentUpdate(draggedComponent, {
          position: snappedPosition,
        });
      }

      // Update temporary connection line during connection mode
      if (tempConnection && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setTempConnection({
          ...tempConnection,
          mouseX: e.clientX - rect.left,
          mouseY: e.clientY - rect.top,
        });
      }
    },
    [draggedComponent, dragOffset, onComponentUpdate, tempConnection]
  );

  const handleMouseUp = useCallback(() => {
    setDraggedComponent(null);
    setTempConnection(null);
    setConnectionMode(null);
  }, []);

  const handleConnectionStart = useCallback(
    (componentId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      setConnectionMode(componentId);
      setTempConnection({
        from: componentId,
        mouseX: e.clientX - rect.left,
        mouseY: e.clientY - rect.top,
      });
    },
    []
  );

  const handleConnectionEnd = useCallback(
    (targetId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (connectionMode && connectionMode !== targetId) {
        onConnect(connectionMode, targetId);
      }
      
      setConnectionMode(null);
      setTempConnection(null);
    },
    [connectionMode, onConnect]
  );

  // Add connection deletion functionality
  const handleConnectionDoubleClick = useCallback((connection: { from: string; to: string }) => {
    // Remove the connection from strategy
    onConnect(connection.from, connection.to); // This should toggle the connection off
  }, [onConnect]);

  // Handle connection disconnection
  const handleDisconnect = useCallback((fromId: string, toId: string) => {
    onConnect(fromId, toId); // Toggle the connection off
  }, [onConnect]);

  const getComponentIcon = (type: string) => {
    switch (type) {
      case "indicator":
        return "📊";
      case "condition":
        return "🔍";
      case "action":
        return "⚡";
      default:
        return "⚙️";
    }
  };

  const getComponentColor = (type: string) => {
    switch (type) {
      case "indicator":
        return "#2196f3";
      case "condition":
        return "#4caf50";
      case "action":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  const handleComponentClick = useCallback((componentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      setSelectedComponents(prev => {
        const newSet = new Set(prev);
        if (newSet.has(componentId)) {
          newSet.delete(componentId);
        } else {
          newSet.add(componentId);
        }
        return newSet;
      });
    } else {
      // Single select
      setSelectedComponents(new Set([componentId]));
    }
  }, []);

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    // Clear selection when clicking on canvas
    if (event.target === event.currentTarget) {
      setSelectedComponents(new Set());
    }
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Delete selected components
        selectedComponents.forEach(componentId => {
          onComponentDelete(componentId);
        });
        setSelectedComponents(new Set());
      } else if (event.key === 'Escape') {
        // Clear selection and exit connection mode
        setSelectedComponents(new Set());
        setConnectionMode(null);
        setTempConnection(null);
      } else if (event.key === 'c' && event.ctrlKey) {
        // Copy selected components (could implement later)
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponents, onComponentDelete]);

  return (
    <Box
      ref={canvasRef}
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: "#fafafa",
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
        cursor: draggedComponent ? "grabbing" : connectionMode ? "crosshair" : "default",
        overflow: "hidden",
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(e) => {
        // Cancel connection mode if clicking on empty canvas
        if (connectionMode && e.target === canvasRef.current) {
          setConnectionMode(null);
          setTempConnection(null);
        }
        // Clear selection when clicking on canvas
        handleCanvasClick(e);
      }}
      onMouseDown={handleCanvasClick}
    >
      {/* Canvas Toolbar */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          display: "flex",
          gap: 1,
          zIndex: 1000,
          backgroundColor: "background.paper",
          borderRadius: 1,
          p: 0.5,
          boxShadow: 2,
        }}
      >
        <Tooltip title={snapToGrid ? "Disable Grid Snap" : "Enable Grid Snap"}>
          <IconButton
            size="small"
            onClick={() => setSnapToGrid(!snapToGrid)}
            color={snapToGrid ? "primary" : "default"}
          >
            {snapToGrid ? <GridOn /> : <GridOff />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Zoom In">
          <IconButton
            size="small"
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
            disabled={zoom >= 2}
          >
            <ZoomIn />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Zoom Out">
          <IconButton
            size="small"
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
            disabled={zoom <= 0.5}
          >
            <ZoomOut />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Center View">
          <IconButton
            size="small"
            onClick={centerCanvas}
            disabled={strategy.components.length === 0}
          >
            <CenterFocusStrong />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Canvas Instructions */}
      {strategy.components.length === 0 && !connectionMode && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            color: "text.secondary",
            pointerEvents: "none",
          }}
        >
          <Typography variant="h6" gutterBottom>
            🎨 Visual Strategy Canvas
          </Typography>
          <Typography variant="body2">
            Drag components from the palette to start building your strategy
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Use the connection handles to link components together
          </Typography>
        </Box>
      )}

      {/* Connection Mode Instructions */}
      {connectionMode && (
        <Box
          sx={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "primary.main",
            color: "primary.contrastText",
            px: 2,
            py: 1,
            borderRadius: 1,
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          <Typography variant="body2">
            🔗 Connection Mode: Click on another component to connect, or click empty space to cancel
          </Typography>
        </Box>
      )}

      {/* Render Components */}
      {strategy.components.map((component) => {
        if (!component.position) return null;

        const isBeingDragged = draggedComponent === component.id;
        const isConnectionSource = connectionMode === component.id;
        const canConnect = connectionMode && connectionMode !== component.id;
        const isHovered = hoveredComponent === component.id;
        const hasConnections = component.connections && component.connections.length > 0;
        const isSelected = selectedComponents.has(component.id);

        return (
          <Paper
            key={component.id}
            elevation={isBeingDragged ? 8 : 2}
            sx={{
              position: "absolute",
              left: component.position.x,
              top: component.position.y,
              minWidth: 220,
              minHeight: 120,
              cursor: isBeingDragged ? "grabbing" : "grab",
              borderLeft: `4px solid ${getComponentColor(component.type)}`,
              border: isSelected
                ? "2px solid #2196f3"
                : isConnectionSource 
                  ? "2px solid #2196f3" 
                  : canConnect 
                    ? "2px dashed #4caf50" 
                    : isHovered 
                      ? "1px solid #ddd" 
                      : undefined,
              boxShadow: isSelected
                ? "0 0 12px rgba(33, 150, 243, 0.6)"
                : isConnectionSource 
                  ? "0 0 10px rgba(33, 150, 243, 0.5)" 
                  : canConnect 
                    ? "0 0 8px rgba(76, 175, 80, 0.4)"
                    : isBeingDragged 
                      ? "0 8px 24px rgba(0, 0, 0, 0.15)"
                      : undefined,
              transform: isBeingDragged ? "scale(1.02)" : "scale(1)",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                elevation: 4,
              },
              zIndex: isBeingDragged ? 1000 : 1,
            }}
            onMouseDown={(e) => {
              if (!connectionMode) {
                handleComponentMouseDown(e, component.id);
              }
            }}
            onMouseEnter={() => setHoveredComponent(component.id)}
            onMouseLeave={() => setHoveredComponent(null)}
            onClick={(e) => {
              if (canConnect) {
                handleConnectionEnd(component.id, e);
              } else {
                handleComponentClick(component.id, e);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Show context menu (implement context menu logic here)
            }}
          >
            <Box sx={{ p: 2, position: "relative" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "1.2em" }}>
                    {getComponentIcon(component.type)}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {component.name}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComponentDelete(component.id);
                  }}
                  sx={{ color: "text.secondary" }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                {component.category}
              </Typography>

              {/* Component Parameters Preview */}
              {Object.keys(component.parameters).length > 0 && (
                <Box
                  sx={{
                    mt: 1,
                    pt: 1,
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Parameters: {Object.keys(component.parameters).length}{" "}
                    configured
                  </Typography>
                </Box>
              )}

              {/* Connection Handles */}
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: -8,
                  transform: "translateY(-50%)",
                }}
              >
                <Tooltip title="Input connection point">
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      backgroundColor: canConnect ? "#4caf50" : "#9e9e9e",
                      border: "2px solid white",
                      cursor: canConnect ? "pointer" : "default",
                      "&:hover": canConnect ? {
                        backgroundColor: "#66bb6a",
                        transform: "scale(1.2)",
                      } : {},
                      transition: "all 0.2s",
                    }}
                    onClick={(e) => {
                      if (canConnect) {
                        handleConnectionEnd(component.id, e);
                      }
                    }}
                  />
                </Tooltip>
              </Box>

              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  right: -8,
                  transform: "translateY(-50%)",
                }}
              >
                <Tooltip title="Create output connection">
                  <IconButton
                    size="small"
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: getComponentColor(component.type),
                      color: "white",
                      "&:hover": {
                        backgroundColor: getComponentColor(component.type),
                        transform: "scale(1.2)",
                      },
                      transition: "all 0.2s",
                    }}
                    onClick={(e) => handleConnectionStart(component.id, e)}
                  >
                    <AddCircle sx={{ fontSize: 12 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Show existing connections */}
              {component.connections && component.connections.length > 0 && (
                <Box sx={{ mt: 1, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Connected to: {component.connections.length} component(s)
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                    {component.connections.map((targetId) => {
                      const targetComponent = strategy.components.find((c) => c.id === targetId);
                      return (
                        <Box
                          key={targetId}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            backgroundColor: "action.hover",
                            borderRadius: 1,
                            px: 0.5,
                            py: 0.25,
                          }}
                        >
                          <Typography variant="caption">
                            {targetComponent?.name || "Unknown"}
                          </Typography>
                          <IconButton
                            size="small"
                            sx={{ width: 16, height: 16 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisconnect(component.id, targetId);
                            }}
                          >
                            <RemoveCircle sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        );
      })}

      {/* Connection Lines and Temporary Connection */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
          <marker
            id="arrowhead-temp"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#2196f3" />
          </marker>
        </defs>

        {/* Existing connections */}
        {strategy.components.map((component) => {
          if (!component.connections || !component.position) return null;

          return component.connections.map((targetId, connIndex) => {
            const targetComponent = strategy.components.find(
              (c) => c.id === targetId
            );
            if (!targetComponent || !targetComponent.position) return null;

            const fromX = component.position!.x + 220; // Right edge of source
            const fromY = component.position!.y + 60; // Center Y of source
            const toX = targetComponent.position!.x; // Left edge of target
            const toY = targetComponent.position!.y + 60; // Center Y of target

            // Calculate control points for curved line
            const controlPoint1X = fromX + (toX - fromX) * 0.5;
            const controlPoint1Y = fromY;
            const controlPoint2X = fromX + (toX - fromX) * 0.5;
            const controlPoint2Y = toY;

            const connectionKey = `${component.id}-${targetId}-${connIndex}`;
            const isHovered = hoveredConnection === connectionKey;

            return (
              <g key={connectionKey}>
                <path
                  d={`M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`}
                  stroke={getComponentColor(component.type)}
                  strokeWidth={isHovered ? 3 : 2}
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  style={{
                    filter: isHovered ? "drop-shadow(0 0 5px rgba(0,0,0,0.3))" : "none",
                    cursor: "pointer",
                    pointerEvents: "stroke",
                  }}
                  onMouseEnter={() => setHoveredConnection(connectionKey)}
                  onMouseLeave={() => setHoveredConnection(null)}
                  onDoubleClick={() => {
                    const targetComponent = strategy.components.find(
                      (c) => c.id === targetId
                    );
                    if (targetComponent) {
                      handleConnectionDoubleClick({
                        from: component.id,
                        to: targetComponent.id,
                      });
                    }
                  }}
                />
                {/* Connection control point for easier deletion */}
                <circle
                  cx={(fromX + toX) / 2}
                  cy={(fromY + toY) / 2}
                  r={isHovered ? 6 : 4}
                  fill={getComponentColor(component.type)}
                  stroke="white"
                  strokeWidth="2"
                  style={{
                    cursor: "pointer",
                    pointerEvents: "all",
                    opacity: isHovered ? 1 : 0.7,
                  }}
                  onMouseEnter={() => setHoveredConnection(connectionKey)}
                  onMouseLeave={() => setHoveredConnection(null)}
                  onClick={() => handleDisconnect(component.id, targetId)}
                />
              </g>
            );
          });
        })}

        {/* Temporary connection line during connection mode */}
        {tempConnection && (
          <g>
            {(() => {
              const sourceComponent = strategy.components.find(
                (c) => c.id === tempConnection.from
              );
              if (!sourceComponent || !sourceComponent.position) return null;

              const fromX = sourceComponent.position.x + 220;
              const fromY = sourceComponent.position.y + 60;
              const toX = tempConnection.mouseX;
              const toY = tempConnection.mouseY;

              const controlPoint1X = fromX + (toX - fromX) * 0.5;
              const controlPoint1Y = fromY;
              const controlPoint2X = fromX + (toX - fromX) * 0.5;
              const controlPoint2Y = toY;

              return (
                <path
                  d={`M ${fromX} ${fromY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toX} ${toY}`}
                  stroke="#2196f3"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  fill="none"
                  markerEnd="url(#arrowhead-temp)"
                  style={{
                    opacity: 0.7,
                  }}
                />
              );
            })()}
          </g>
        )}
      </svg>
    </Box>
  );
};
