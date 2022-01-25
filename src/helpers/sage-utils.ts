import * as cql from 'cql-execution';
import { Library } from 'fhir/r4';

export function getCqlExecutionLibraryFromInputLibraryResource(resource: unknown) {
    if (resource && typeof resource == 'object') {
        const resourceToTest = resource as Partial<Library>; // Assume Partial type so that we're forced to check each property
        if (!resourceToTest.url) {
            return null; // Libraries are useless when building a PD if we can't reference them by URL
        }
        if (Array.isArray(resourceToTest.content)) {
            for (const content of resourceToTest.content) {
                if (content.contentType == "application/elm+json") {
                    if (content.data) {
                        try {
                            const elm = JSON.parse(window.atob(content.data));
                            const parsedLib = getCqlExecutionLibraryFromJsonElm(elm);
                            if (parsedLib) {
                                return {
                                    library: parsedLib,
                                    url: resourceToTest.url
                                };
                            }
                        }
                        catch(error) {
                            console.log("Could not parse encoded JSON ELM in resource:", resource);
                            return null;
                        }
                    }
                }
            }
            console.log("No JSON ELM found in resource:", resource);
        }
    }
    return null;
}

export function getCqlExecutionLibraryFromJsonElm(elm: unknown) {
    try {
        const parsedLib = new cql.Library(elm);
        console.log('parsed library into:', parsedLib);
        return parsedLib;
    }
    catch(error) {
        console.log("cql-execution library could not parse ELM:", elm);
        return null;
    }
}
