import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import useRecipeSearch from '../hooks/useRecipeSearch';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Text, Button } from 'react-native';

const server = setupServer(
  rest.post('http://localhost:8080/search', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ best_score: 0.6, results: [{ score: 0.6, title: 'AI Rice', ingredients: 'rice, salt', instructions: 'mix' }] })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function TestComponent() {
  const { search, loading, error, lastResult } = useRecipeSearch('http://localhost:8080');

  return (
    <>
      <Button title="Search" onPress={() => search('rice, pineapple', 3)} />
      {loading && <Text>Loading...</Text>}
      {error && <Text>{error}</Text>}
      {lastResult && lastResult.results.length > 0 && <Text testID="title">{lastResult.results[0].title}</Text>}
    </>
  );
}

describe('useRecipeSearch', () => {
  test('search updates lastResult and loading state', async () => {
    const { getByText, findByTestId } = render(<TestComponent />);
    fireEvent.press(getByText('Search'));

    // wait for title to appear
    const title = await findByTestId('title');
    expect(title.props.children).toBe('AI Rice');
  });

  test('handles server error', async () => {
    server.use(
      rest.post('http://localhost:8080/search', (req, res, ctx) => {
        return res(ctx.status(500), ctx.text('boom'));
      })
    );

    const { getByText, findByText } = render(<TestComponent />);
    fireEvent.press(getByText('Search'));
    const err = await findByText(/Status 500/);
    expect(err).toBeTruthy();
  });
});