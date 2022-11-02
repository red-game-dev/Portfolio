import '@testing-library/jest-dom/extend-expect'
import '@testing-library/jest-dom';
import 'jest-styled-components'

window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
}));

window.scroll = jest.fn();
window.alert = jest.fn();