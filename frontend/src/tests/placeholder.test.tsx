import { render } from '@testing-library/react';
import HomePage from '../app/page';

test('renders homepage', () => {
  const { getByText } = render(<HomePage /> as any);
  expect(getByText(/Welcome/i)).toBeTruthy();
});
