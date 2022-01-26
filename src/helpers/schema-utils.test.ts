import { Resource, PlanDefinition } from 'fhir/r4';

import * as SchemaUtils from './schema-utils';
import State from '../state';

import _samplePD from '../../test/sample-plandef.json';
import _samplePDWithProfile from '../../test/sample-plandef.json';
import _r4Profiles from '../../public/profiles/r4.json';
import _cpgProfiles from '../../public/profiles/cpg.json';

const r4: SchemaUtils.SimplifiedProfiles = (_r4Profiles as any).profiles as any;
const cpg: SchemaUtils.SimplifiedProfiles = (_cpgProfiles as any).profiles as any;
const r4AndCpg: SchemaUtils.SimplifiedProfiles = {
    ...r4,
    ...cpg,
};

const samplePD = _samplePD as PlanDefinition;
const samplePDWithProfile = _samplePDWithProfile as PlanDefinition;

const validResource = {
    resourceType: "PlanDefinition",
    meta: {
        profile: [
            'someProfileUri'
        ]
    }
} as PlanDefinition

const fakeResourceType = {
    resourceType: "FakeResourceType",
    meta: {
        profile: [
            'someFakeProfileUri'
        ]
    }
} as Resource

const invalidResource = {
    "id": "1032702",
    "meta": {
        "versionId": "1",
        "lastUpdated": "2015-09-25T15:32:35.970+00:00"
    },
}

const startState = State.get().set({
    CPGName: 'test-cpg-name',
    publisher: 'test-cpg-author',
});

beforeEach(() => {
    State.set(startState);
});

test('if isResource is true on valid Resource', () => {
    expect(SchemaUtils.isSupportedResource(validResource)).toBe(true);
    expect(SchemaUtils.isSupportedResource(samplePD)).toBe(true);
});

test('if isResource is false on invalid Resource', () => {
    expect(SchemaUtils.isSupportedResource(invalidResource)).toBe(false);
});

test('if getProfileOfResource gets the correct profile', () => {
    expect(SchemaUtils.getProfileOfResource(r4, samplePD)).toBe('http://hl7.org/fhir/StructureDefinition/PlanDefinition');
    expect(SchemaUtils.getProfileOfResource(r4, validResource)).toBe('http://hl7.org/fhir/StructureDefinition/PlanDefinition');
    expect(SchemaUtils.getProfileOfResource(r4AndCpg, samplePD)).toBe('http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-computableplandefinition');
});

test('if getProfileOfResource returns undefined when no standard r4 profile exists', () => {
    expect(SchemaUtils.getProfileOfResource(r4, fakeResourceType)).toBeUndefined();
});

it("should return the given name in PascalCase", () => {
    expect(SchemaUtils.buildDisplayName("PlanDefinition")).toBe('PlanDefinition');
    expect(SchemaUtils.buildDisplayName("subjectCodeableConcept")).toBe('SubjectCodeableConcept');
});

it("should return the given name in PascalCase with its slicename", () => {
    expect(SchemaUtils.buildDisplayName("extension", "knowledgeRepresentationLevel")).toBe('Extension:knowledgeRepresentationLevel');
});

it('should process a multi-type element correctly when loading a JSON', () => {
    const decoratedNode = SchemaUtils.decorateFhirData(r4AndCpg, samplePD);
    expect(decoratedNode).toBeDefined();

    const useContextChild = SchemaUtils.getChildOfNode(decoratedNode!, "useContext")!.children[0];
    expect(SchemaUtils.getChildOfNode(useContextChild, "valueCodeableConcept")).toBeDefined();

    // Since a multi-type element was given, do not show it as an available child to add
    const availableChildren = SchemaUtils.getAvailableElementChildren(r4AndCpg, useContextChild);
    expect(availableChildren).not.toEqual(
        expect.arrayContaining([
            expect.objectContaining({
                nodePath: "UsageContext.value[x]"
            })
        ]));
});

it('should not be missing any original data when a JSON is loaded by decorateFhirData() then exported by toFhir()', () => {
    const decoratedNode = SchemaUtils.decorateFhirData(r4AndCpg, samplePD);
    expect(decoratedNode).toBeDefined();

    expect(SchemaUtils.toFhir(decoratedNode!, false)).toEqual(expect.objectContaining<Resource>(samplePD));
});

it('should not overwrite the supplied profile when a JSON is loaded by decorateFhirData() then exported by toFhir()', () => {
    const decoratedNode = SchemaUtils.decorateFhirData(r4AndCpg, samplePDWithProfile);
    expect(decoratedNode).toBeDefined();

    expect(SchemaUtils.toFhir(decoratedNode!, false)).toEqual(expect.objectContaining<Resource>(samplePDWithProfile));
});

test('if original element index is preserved when the definition of the element is a reference to another definition', () => {
    const decoratedNode = SchemaUtils.decorateFhirData(r4AndCpg, samplePD);
    expect(decoratedNode).toBeDefined();
    
    // check import
    const actionNode = SchemaUtils.getChildOfNode(decoratedNode!, 'action');
    const subActionNode = SchemaUtils.getChildOfNode(actionNode!.children[0], 'action');
    expect(subActionNode?.index).toBe(r4AndCpg[actionNode!.profile!]['PlanDefinition.action.action'].index);

    // check re-import
    const fhirJson = SchemaUtils.toFhir(decoratedNode!, false);
    const decoratedNode2 = SchemaUtils.decorateFhirData(r4AndCpg, fhirJson);
    const actionNode2 = SchemaUtils.getChildOfNode(decoratedNode2!, 'action');
    const subActionNode2 = SchemaUtils.getChildOfNode(actionNode2!, 'action'); // objectArray
    expect(subActionNode2?.index).toBe(r4AndCpg[actionNode2!.profile!]['PlanDefinition.action.action'].index);
});

// WIP
// it('should return all possible element children of an element whose definition is a reference to another definition', () => {
//     const decoratedNode = SchemaUtils.decorateFhirData(r4AndCpg, samplePD);
//     expect(decoratedNode).toBeDefined();
    
//     // check import
//     const actionNode = SchemaUtils.getChildOfNode(decoratedNode!, 'action');
//     const subActionNode = SchemaUtils.getChildOfNode(actionNode!.children[0], 'action');
    
//     const availableChildren = SchemaUtils.getElementChildren(r4AndCpg, subActionNode!.children[0]!, []);
//     const subActionUninitNode = availableChildren.find((v, i) => v.nodePath == 'PlanDefinition.action.action');
//     const newSubActionNode = SchemaUtils.buildChildNode(r4AndCpg, actionNode!, subActionUninitNode!, subActionUninitNode!.fhirType);
//     const availableSubActionChildren = SchemaUtils.getElementChildren(r4AndCpg, newSubActionNode!, []);

// });
