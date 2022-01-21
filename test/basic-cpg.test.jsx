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

test('Create a basic CPG with a single PD that uses the hypertension library and export it', async () => {
    render(<RootComponent />);
    // Wait for profiles to load
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar', {name: "loading-symbol"}), {timeout: 5000, interval: 1000});
    // RootComponent
    userEvent.click(screen.getAllByRole('button', {name: 'Basic CPG'})[0]);
    // CpgDialog open on screen
    userEvent.click(await screen.findByRole('button', {name: 'Open Resource'}));
    // SelectView
    userEvent.click(await screen.findByText('AdministerMedication'));
    // SimpleForm
    await screen.findByText('ActivityDefinition/Plandefinition');
    userEvent.type(screen.getByLabelText('Title'), '123');
    userEvent.type(screen.getByLabelText('Description'), '321');
    userEvent.selectOptions(screen.getByLabelText('Condition'), 'HypertensionCA.Mean BP >= 180/110');
    fireEvent.submit(screen.getByRole('button', {name: 'Save Resource'}));
    // Collection
    await screen.findByText('Saved Resources');
    userEvent.click(screen.getByRole('button', {name: 'Export Resource'}));
    // ExportDialog open on screen
    await screen.findByText('Exported FHIR JSON');
    expect(JSON.parse(screen.getByRole('textbox', {name: "exportedJson"}).textContent)).toStrictEqual(basicCpgExport);
})

test.only('Create an advanced CPG with a PlanDefinition linked to an ActiviityDefinition and export it', async () => {
    render(<RootComponent />);
    // Wait for profiles to load
    await waitForElementToBeRemoved(() => screen.queryByRole('progressbar', {name: "loading-symbol"}), {timeout: 5000, interval: 1000});
    
    userEvent.click(screen.getAllByRole('button', {name: 'Advanced CPG'})[0]);
    userEvent.click(await screen.findByRole('button', {name: 'Open Resource'}));

    userEvent.click(await screen.findByText('Action'));
    fireEvent.click(await screen.findByTestId('DefinitionCanonical'), undefined, { skipPointersEventsCheck: true });
    // screen.debug(undefined, Infinity);
    userEvent.selectOptions(await screen.findByTestId('select-DefinitionCanonical'), 'Create a new ActivityDefinition');

    await screen.findByText('ActivityDefinition');
    userEvent.click(await screen.findByText('Export JSON'));

    await screen.findByText('Exported FHIR JSON');
    expect(JSON.parse(screen.getByRole('textbox', {name: "exportedJson"}).textContent)).toStrictEqual(advancedCpgExport);
})
