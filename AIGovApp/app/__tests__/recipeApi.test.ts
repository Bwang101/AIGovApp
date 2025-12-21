import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { searchRecipes, generateRecipe } from '../lib/recipeApi';

const server = setupServer(
  rest.post('http://localhost:8080/search', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ best_score: 0.88, results: [{ score: 0.88, title: 'Pineapple Rice', ingredients: 'rice, pineapple', instructions: 'cook rice, mix' }] })
    );
  }),
  rest.post('http://localhost:8080/generate', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ generated: 'Generated recipe: use rice and pineapple.' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('recipeApi', () => {
  test('searchRecipes returns parsed response', async () => {
    const res = await searchRecipes('rice, pineapple', 3, 'http://localhost:8080');
    expect(res.best_score).toBeCloseTo(0.88);
    expect(res.results[0].title).toBe('Pineapple Rice');
  });

  test('generateRecipe returns generated text', async () => {
    const res = await generateRecipe('rice, pineapple', 'http://localhost:8080');
    expect(res.generated).toContain('Generated recipe');
  });

  test('searchRecipes surfaces non-OK as error', async () => {
    server.use(
      rest.post('http://localhost:8080/search', (req, res, ctx) => {
        return res(ctx.status(500), ctx.text('internal fail'));
      })
    );

    await expect(searchRecipes('rice', 1, 'http://localhost:8080')).rejects.toThrow(/Status 500/);
  });
});