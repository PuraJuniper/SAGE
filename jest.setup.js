import 'dotenv/config' // Loads variables from file ".env" into NodeJS's `process.env` global
import '@testing-library/jest-dom'

import $ from 'jquery';
global.$ = $;

jest.setTimeout(10000);
if (process.env.CI) {
    jest.setTimeout(30000); // Initial loading of profiles takes a lot longer on GH Actions
}

// Mock functions
window.scrollTo = jest.fn(); // unimplemented in jsdom
console.log = jest.fn(); // comment if logs are needed, otherwise use console.debug in your tests

jest.spyOn(global.Date, 'now').mockImplementation(() => 0);

let _mockedUuidV4Count = 0;
jest.mock('uuid',() => ({
    v4: () => {
        _mockedUuidV4Count += 1;
        return `v4-uuid-${_mockedUuidV4Count}`
    }
}));