import { render, screen } from '@testing-library/react';
import App from './App';

test('renders react_app link', () => {
  render(<App />);
  const linkElement = screen.getByText(/test react_app/i);
  expect(linkElement).toBeInTheDocument();
});
