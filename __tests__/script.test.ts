import '../src/script';
import {generateReadme} from '../src/index'
jest.mock('../src/index');

it('should execute generateReadme', () => {
  expect(generateReadme).toHaveBeenCalled();
})