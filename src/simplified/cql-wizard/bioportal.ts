import axios from "axios";
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
};

// Map urls back to their name on Bioportal
export const systemUrlToOntology: {[systemUrl: string]: string | undefined} = {};
Object.entries(ontologyToSystemAndVersion).forEach(v => v[1] ? (systemUrlToOntology[v[1].system] = v[0]) : null)

/**
 * Search Bioportal for codes matching the query
 * @param text Text to search for
 * @param ontologies Which ontologies (systems) should this search be restricted to, if any
 * @returns Results from the search
 */
export async function searchForText(text: string, ontologies?: string[]): Promise<SageCoding[]> {
    let res: SageCoding[] = [];
    const ontologiesParam = ontologies === undefined ? Object.keys(ontologyToSystemAndVersion).join(',') : ontologies.join(',');
    try {
        const response = await axios({
            url: "https://data.bioontology.org/search",
            method: "GET",
            params: {
                q: text,
                ontologies: ontologiesParam,
                apikey: State.get().bioportalApikey,
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

export async function searchForSNOMEDConcept(concept: string): Promise<SageCoding[]> {
    let res: SageCoding[] = [];
    try {
        const conceptResponse = await axios({
            url: "https://data.bioontology.org/search",
            method: "GET",
            params: {
                q: concept,
                ontologies: "SNOMEDCT",
                apikey: State.get().bioportalApikey,
            }
        })
        const descendantsUrl = (conceptResponse.data.collection as Array<any>)[0].links.descendants;

        const response = await axios({
            url: descendantsUrl,
            method: "GET",
            params: {
                apikey: State.get().bioportalApikey,
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
                code: v.notation ?? (v['@id'] as string).split('/').pop(), // "notation" isn't working on this endpoint for some reason
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
