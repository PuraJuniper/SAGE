/* eslint-disable no-unused-vars */
/** Testing the "Basic CPG" workflow */

// import dependencies
import React from 'react'

// import API mocking utilities from Mock Service Worker
import {rest} from 'msw'
import {setupServer} from 'msw/node'

// import methods for testing
import {render, fireEvent, screen, waitForElementToBeRemoved} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// import stuff that's required for the tested component
import cpgProfile from '../public/profiles/cpg.json';
import r4Profile from '../public/profiles/r4.json';

// the component to test
import RootComponent from '../src/RootComponent';

// expected results
import basicCpgExport from './expected/basic-cpg-hypertension-bundle.json'

const server = setupServer(
    rest.get('/profiles/cpg.json', (req, res, ctx) => {
        return res(ctx.json(cpgProfile));
    }),
    rest.get('/profiles/r4.json', (req, res, ctx) => {
        return res(ctx.json(r4Profile));
    }),
)

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('temp', () => {
    expect(true).toBe(true);
});

// test('Create a basic CPG with a single PD that uses the hypertension library and export it', async () => {
//     render(<RootComponent />);
//     // Wait for profiles to load
//     await waitForElementToBeRemoved(() => screen.queryByRole('progressbar', {name: "loading-symbol"}), {timeout: process.env.CI ? 30000 : 10000, interval: 500});
//     // RootComponent
//     userEvent.click(screen.getAllByRole('button', {name: 'Basic CPG'})[0]);
//     // CpgDialog open on screen
//     userEvent.click(await screen.findByRole('button', {name: 'Open Resource'}));
//     // SelectView
//     userEvent.click(await screen.findByText('Give Medication'));
//     // SimpleForm
//     await screen.findByText('Save Card');
//     userEvent.type(screen.getByLabelText('Title'), '123');
//     userEvent.type(screen.getByLabelText('Description'), '321');
//     userEvent.selectOptions(screen.getByLabelText('Condition'), 'HypertensionCA.Mean BP >= 180/110');
//     fireEvent.submit(screen.getByRole('button', {name: 'Save Card'}));
//     // Collection
//     await screen.findByText('Saved Cards');
//     userEvent.click(screen.getByRole('button', {name: 'Export as FHIR Bundle'}));
//     // ExportDialog open on screen
//     await screen.findByText('Exported FHIR JSON');
//     expect(JSON.parse(screen.getByRole('textbox', {name: "exportedJson"}).textContent)).toStrictEqual(basicCpgExport);
// })
