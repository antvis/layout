import { createGraphCanvas } from '@@/utils/create';
import { circular } from '../demos';

describe('layout circular', () => {
  it('basic', async () => {
    const canvas = createGraphCanvas();

    await expect(circular(canvas)).toMatchSnapshot(__filename);
  });
});
