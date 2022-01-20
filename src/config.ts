const hiddenElements = [
    // All
    '*.meta',
    // PlanDefinition
    'PlanDefinition.meta', 'PlanDefinition.url', 'PlanDefinition.id', 'PlanDefinition.name', 'PlanDefinition.publisher', 'PlanDefinition.version',
    // ActivityDefinition
    'ActivityDefinition.meta', 'ActivityDefinition.url', 'ActivityDefinition.id', 'ActivityDefinition.name', 'ActivityDefinition.publisher', 'ActivityDefinition.version',
    // Questionnaire
    'Questionnaire.meta', 'Questionnaire.url', 'Questionnaire.id', 'Questionnaire.name', 'Questionnaire.publisher', 'Questionnaire.version',
    'Questionnaire.linkId'
];

// The default profile used when the specified Resource type is created.
type ResourceTypeToUri = {
    [key: string]: string
}
// We want to apply base-level cpg profiles to all relevant Resources (PlanDefinitions, ActivityDefinitions, etc),
//  so we must manually fix that profile's URI per Resource
const defaultProfileUriOfResourceType: ResourceTypeToUri = {
    'PlanDefinition': 'http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-computableplandefinition',
    'ActivityDefinition': 'http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-computableactivity',
    // 'Extension': 'http://hl7.org/fhir/StructureDefinition/Extension',
    // 'DataRequirement': 'http://hl7.org/fhir/StructureDefinition/DataRequirement'
}

export {hiddenElements, defaultProfileUriOfResourceType}
