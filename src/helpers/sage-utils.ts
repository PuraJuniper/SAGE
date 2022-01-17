import * as cql from 'cql-execution';

export function getCqlExecutionLibraryFromInputLibraryResource(resource: any) {
    if (resource.content && Array.isArray(resource.content)) {
        for (const content of resource.content) {
            if (content.contentType == "application/elm+json") {
                if (content.data) {
                    try {
                        const elm = JSON.parse(window.atob(content.data));
                        const parsedLib = getCqlExecutionLibraryFromJsonElm(elm);
                        if (parsedLib) {
                            return {
                                library: parsedLib,
                                url: resource.url
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
    return null;
}

export function getCqlExecutionLibraryFromJsonElm(elm: any) {
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
