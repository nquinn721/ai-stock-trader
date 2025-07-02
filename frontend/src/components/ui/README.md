# Trading App UI Component Library

A standardized component library for the Stock Trading App, ensuring consistent styling and behavior across all pages. All components follow the dashboard design patterns and use the shared trading theme variables.

## Components

### PageHeader

A sticky header component with gradient text, market status, and navigation controls.

```tsx
import { PageHeader } from "../components/ui";

<PageHeader
  title="Dashboard"
  subtitle="Live Trading Session"
  marketTime="Market Open"
  isConnected={true}
  sticky={true}
  stats={[
    { label: "Portfolio", value: "$125,432", tooltip: "Total portfolio value" },
    { label: "P&L", value: "+$2,341", tooltip: "Today's profit/loss" },
  ]}
  navigationButtons={[
    { label: "Analytics", onClick: () => navigate("/analytics") },
    { label: "Trading", onClick: () => navigate("/trading") },
  ]}
  actionButtons={[
    {
      icon: <Settings />,
      onClick: () => setSettingsOpen(true),
      tooltip: "Settings",
    },
  ]}
/>;
```

### ContentCard

A flexible card component with multiple variants and built-in loading states.

```tsx
import { ContentCard } from "../components/ui";

<ContentCard
  title="Portfolio Overview"
  subtitle="Current holdings and performance"
  variant="gradient"
  padding="lg"
  hover={true}
  headerActions={<Button>View Details</Button>}
>
  <div>Card content goes here</div>
</ContentCard>;
```

**Variants:**

- `default` - Standard gradient background
- `gradient` - Enhanced gradient with more depth
- `glass` - Glassmorphism effect
- `minimal` - Subtle background

### TradingButton

Themed buttons with loading states and multiple color variants.

```tsx
import { TradingButton } from "../components/ui";

<TradingButton
  variant="primary"
  size="md"
  loading={isLoading}
  icon={<PlayArrow />}
  onClick={handleStart}
>
  Start Trading
</TradingButton>;
```

**Variants:**

- `primary` - Main action button (blue gradient)
- `secondary` - Secondary actions (purple gradient)
- `success` - Success actions (green gradient)
- `danger` - Destructive actions (red gradient)
- `warning` - Warning actions (yellow gradient)
- `ghost` - Subtle outline button
- `nav` - Navigation button style

### StatusChip

Animated status indicators with color-coded meanings.

```tsx
import { StatusChip } from "../components/ui";

<StatusChip status="active" size="md" animated={true}>
  Trading Active
</StatusChip>;
```

**Status Types:**

- `active` - Green with pulsing dot
- `inactive` - Gray
- `ready` - Blue
- `loading` - Purple with spinning indicator
- `error` - Red
- `warning` - Yellow
- `success` - Green

### LoadingState

Comprehensive loading indicators with multiple visual styles.

```tsx
import { LoadingState } from "../components/ui";

<LoadingState
  variant="spinner"
  size="md"
  message="Loading market data..."
  fullHeight={true}
/>;
```

**Variants:**

- `spinner` - Circular progress indicator
- `skeleton` - Skeleton placeholder animation
- `pulse` - Pulsing circle with rings

## Design Principles

### 1. Consistency

All components use the same design tokens from `shared-styles.css`:

- Colors: CSS variables (`--trading-*`)
- Spacing: Consistent padding and margins
- Typography: Standardized font weights and sizes
- Animations: Smooth transitions and effects

### 2. Accessibility

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Color contrast compliance

### 3. Responsive Design

- Mobile-first approach
- Breakpoints: 480px, 768px, 1024px, 1200px
- Flexible layouts using CSS Grid and Flexbox
- Touch-friendly interactive elements

### 4. Performance

- Optimized animations using CSS transforms
- Minimal re-renders with proper prop handling
- Efficient CSS with specific selectors
- Lazy loading support

## Usage Guidelines

### Importing Components

```tsx
// Import individual components
import { PageHeader, ContentCard, TradingButton } from "../components/ui";

// Import with types
import { PageHeader, type PageHeaderProps } from "../components/ui";
```

### Theme Integration

All components automatically inherit the trading app theme:

```css
/* Automatically available in all components */
--trading-primary-500
--trading-text-primary
--trading-text-secondary
--trading-border-secondary
--trading-radius-xl
/* ... and many more */
```

### Layout Patterns

Use the standardized layout structure:

```tsx
<div className="page-container">
  <PageHeader title="Page Title" sticky={true} />
  <div className="dashboard-content">
    <div className="content-grid">
      <ContentCard title="Card 1">Content</ContentCard>
      <ContentCard title="Card 2">Content</ContentCard>
    </div>
  </div>
</div>
```

## CSS Grid Helpers

The library provides CSS grid utilities:

```css
.content-grid         /* Auto-fit with 300px minimum */
.content-grid--2-col  /* 2 column responsive grid */
.content-grid--3-col  /* 3 column responsive grid */
.content-grid--4-col  /* 4 column responsive grid */
```

## Animation Classes

Standard animation classes available:

```css
.slideInUp      /* Slide in from bottom */
.slideInDown    /* Slide in from top */
.pulse-glow     /* Pulsing glow effect */
.shimmer        /* Loading shimmer effect */
```

## Development Guidelines

### Adding New Components

1. Create component in `src/components/ui/ComponentName.tsx`
2. Create styles in `src/components/ui/ComponentName.css`
3. Export from `src/components/ui/index.ts`
4. Follow existing patterns for props and styling
5. Add comprehensive documentation

### Styling Standards

```css
/* Import shared styles first */
@import "../../shared-styles.css";

/* Use BEM-like naming */
.component-name {
  /* Base styles */
}

.component-name__element {
  /* Element styles */
}

.component-name--modifier {
  /* Modifier styles */
}

/* Use CSS variables */
color: var(--trading-text-primary);
background: var(--trading-btn-gradient-primary);
```

### TypeScript Standards

```tsx
// Export interfaces for external use
export interface ComponentProps {
  required: string;
  optional?: boolean;
  children: React.ReactNode;
}

// Use proper prop destructuring
const Component: React.FC<ComponentProps> = ({
  required,
  optional = false,
  children,
  ...rest
}) => {
  return <div {...rest}>{children}</div>;
};
```

## Testing

Each component should include:

- Unit tests for all props and states
- Accessibility tests
- Visual regression tests
- Integration tests with real data

## Migration Guide

### From Inline Styles

Replace inline styles with component library:

```tsx
// Before
<div style={{
  background: 'linear-gradient(...)',
  padding: '24px',
  borderRadius: '16px'
}}>
  Content
</div>

// After
<ContentCard padding="lg">
  Content
</ContentCard>
```

### From Custom Components

Replace custom buttons and cards:

```tsx
// Before
<CustomButton primary loading={isLoading}>
  Submit
</CustomButton>

// After
<TradingButton variant="primary" loading={isLoading}>
  Submit
</TradingButton>
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow existing component patterns
2. Use TypeScript for all components
3. Include comprehensive CSS styles
4. Add proper documentation
5. Test on multiple devices and browsers
