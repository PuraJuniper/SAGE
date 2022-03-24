/** Testing the "Advanced CPG" workflow */

// import dependencies
import React from 'react'

// import API mocking utilities from Mock Service Worker
import {rest} from 'msw'
import {setupServer} from 'msw/node'

// import methods for testing
import {render, screen, waitForElementToBeRemoved, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// import stuff that's required for the tested component
import cpgProfile from '../public/profiles/cpg.json';
import r4Profile from '../public/profiles/r4.json';

// the component to test
import RootComponent from '../src/RootComponent';

// expected results
import advancedCpgExport from './expected/advanced-cpg-plan-activity-bundle.json'

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

// eslint-disable-next-line jest/no-disabled-tests
test.skip('Create an advanced CPG with a PlanDefinition linked to an ActiviityDefinition and export it', async () => {
    render(<RootComponent />);
    // Wait for profiles to load
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar', {name: "loading-symbol"}), {timeout: process.env.CI ? 30000 : 10000, interval: 1000});
    
    userEvent.click(screen.getAllByRole('button', {name: 'Advanced CPG'})[0]);
    userEvent.click(await screen.findByRole('button', {name: 'Open Resource'}));

    userEvent.click(await screen.findByText('Action'));
    userEvent.click(await within(await screen.findByTestId('Action-dropdown')).findByRole('button', {name: /definitioncanonical/i}));
    userEvent.selectOptions(await screen.findByTestId('select-DefinitionCanonical'), 'Create a new ActivityDefinition');

    await screen.findByText('ActivityDefinition');
    userEvent.click(await screen.findByText('Export JSON'));

    await screen.findByText('Exported FHIR JSON');
    expect(JSON.parse(screen.getByRole('textbox', {name: "exportedJson"}).textContent)).toStrictEqual(advancedCpgExport);
})
