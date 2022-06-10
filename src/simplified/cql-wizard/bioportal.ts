import axios from "axios";
import _ from "lodash";
import State from "../../state";
import { SageCoding } from "./wizardLogic";

// These ontology names are from Bioportal
export const ontologyToSystemAndVersion: {[key: string]: {system: string, version: string} | undefined} = {
    'SNOMEDCT': {
        system: "http://snomed.info/sct",
        version: "20220301",
    },
    'ICD10CM': {
        system: "http://hl7.org/fhir/sid/icd-10-cm",
        version: "",
    },
    'ICD9CM': {
        system: 'http://hl7.org/fhir/sid/icd-9-cm',
        version: "",
    },
    'ICD10': {
        system: 'http://hl7.org/fhir/sid/icd-10',
        version: "",
    },
    'LOINC': {
        system: "http://loinc.org",
        version: "",
    },
    'RXNORM': {
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        version: "03072022",
    },
    'HL7': {
        system: "",
        version: "2021AB"

    }
};

// Map urls back to their name on Bioportal
export const systemUrlToOntology: {[systemUrl: string]: string | undefined} = {};
Object.entries(ontologyToSystemAndVersion).forEach(v => v[1] ? (systemUrlToOntology[v[1].system] = v[0]) : null)


export async function search(text: string, ontologies?: string[], searchType?: string, semanticTypes?: string[], requireExactMatch?: boolean): Promise<SageCoding[]> {
    const ontologiesParam = ontologies === undefined ? Object.keys(ontologyToSystemAndVersion).join(',') : ontologies.join(',');
    if (searchType && searchType == 'concept' && ontologies && ontologies.includes('SNOMEDCT')) {
        return await searchForSNOMEDConcept(text);
    } else if (searchType && searchType == 'text') {
        return await searchForText(text, ontologies, semanticTypes, requireExactMatch);
    } else {
        return await searchForConcept(text, ontologies)
    }
}

/**
 * Search Bioportal for codes matching the query
 * @param text Text to search for
 * @param ontologies Which ontologies (systems) should this search be restricted to, if any
 * @returns Results from the search
 */
export async function searchForText(text: string, ontologies?: string[], semanticTypes?: string[], requireExactMatch?: boolean): Promise<SageCoding[]> {
    let res: SageCoding[] = [];
    const ontologiesParam = ontologies === undefined ? Object.keys(ontologyToSystemAndVersion).join(',') : ontologies.join(',');
    try {
        const response = await axios({
            url: "https://data.bioontology.org/search",
            method: "GET",
            params: {
                q: text,
                display_context: 'false',
                require_exact_match: requireExactMatch,
                ontologies: ontologiesParam,
                apikey: State.get().bioportalApikey,
                semantic_types: semanticTypes === undefined ? null : semanticTypes.reduce((acc, type) => acc + type + ','),
                include: "prefLabel,synonym,definition,notation"
            }
        })
        // Convert response to SageCoding array
        res = (response.data.collection as Array<any>).flatMap<SageCoding>(v => {
            const ontologyName = (v.links.ontology as string).split('/').pop();
            if (ontologyName === undefined) {
                return [];
            }
            const {system, version} = ontologyToSystemAndVersion[ontologyName] ?? { system: "unknown", version: "unknown"};
            return [{
                code: v.notation,
                display: v.prefLabel,
                system: system,
                version: version,
                __sageDefinitions: (v.definition as Array<string>),
                __sageSynonyms: (v.synonym as Array<string>),
            }]
        })
    }
    catch (e) {
        console.log(`Error contacting bioportal api: ${e}`);
    }

    return res
}

export const memoizedSearchForText = _.memoize(searchForText)

export async function searchForSNOMEDConcept(concept: string): Promise<SageCoding[]> {
    return await searchForConcept(concept, ["SNOMEDCT"])
}

async function searchForConcept(concept: string, ontologies?: string[]) {

    const ontologiesParam = ontologies === undefined ? Object.keys(ontologyToSystemAndVersion).join(',') : ontologies.join(',');
    try {
        const conceptResponse = await axios({
            url: "https://data.bioontology.org/search",
            method: "GET",
            params: {
                q: concept,
                ontologies: ontologiesParam,
                apikey: State.get().bioportalApikey,
            }
        });
        const descendantsUrl = (conceptResponse.data.collection as Array<any>)[0]?.links?.descendants;
        if (descendantsUrl === undefined) {
            return [];
        }
        const response = await axios({
            url: descendantsUrl,
            method: "GET",
            params: {
                apikey: State.get().bioportalApikey,
                include: "prefLabel,synonym,definition,notation"
            }
        });
        // Convert response to SageCoding array
        return (response.data.collection as Array<any>).flatMap<SageCoding>(v => {
            const ontologyName = (v.links.ontology as string).split('/').pop();
            if (ontologyName === undefined) {
                return [];
            }
            const { system, version } = ontologyToSystemAndVersion[ontologyName] ?? { system: "unknown", version: "unknown" };
            return [{
                code: v.notation ?? (v['@id'] as string).split('/').pop(),
                display: v.prefLabel,
                system: system,
                version: version,
                __sageDefinitions: (v.definition as Array<string>),
                __sageSynonyms: (v.synonym as Array<string>),
            }];
        });
    }
    catch (e) {
        console.log(`Error contacting bioportal api for concept ${concept}: ${e}`);
    }
    return [];
}

