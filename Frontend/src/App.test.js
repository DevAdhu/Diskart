import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the DisKart navbar', () => {
  render(<App />);
  expect(screen.getByText(/DisKart/i)).toBeInTheDocument();
});
