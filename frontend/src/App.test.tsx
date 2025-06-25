import React from 'react';
import { render, screen } from './tests/test-utils';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  // Just check that the app renders without throwing errors
  // The actual content depends on the app state and routing
  expect(document.body).toBeInTheDocument();
});
