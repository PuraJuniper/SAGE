import { useEffect, useState } from "react";
import JSZip from "jszip";
import { Library } from "fhir/r4";
import * as SageUtils from "./helpers/sage-utils";
import State from "./reactions";

// All properties should be optional to force us to verify the output
interface AHRQOutput {
    libraryName?: string,
    libraryZip?: Blob,
}

const AhrqFrame = () => {
	useEffect(() => {
		const handler = ((event: CustomEvent<AHRQOutput>) => {
			console.log(event);
			if (event.detail) {
                if (!event.detail.libraryZip || !event.detail.libraryName) {
                    console.log("Error - Invalid data received from AHRQ CQL Authoring Tool");
                    return;
                }
				JSZip.loadAsync(event.detail.libraryZip).then(async (zip) => {
                    const libraryFile = zip.file(`Library-${event.detail.libraryName}.json`);
                    const v = await libraryFile?.async("text");
                    if (!v) {
                        console.log("Error - could not parse Library FHIR Resource from AHRQ CQL Authoring Tool");
                        return;
                    }
                    const parsedFhir = JSON.parse(v) as Library; // trusting this is a valid library
                    const libraryName = parsedFhir.name;
                    if (libraryName) {
                        if (!parsedFhir.url) {
                            console.log(`No URL set for Library -- defaulting to 'ahrq://${parsedFhir.name}'`);
                            parsedFhir.url = `ahrq://${parsedFhir.name}`;
                        }

                        // Received FHIR Library does not include the JSON ELM under `content`, so we'll need to add it
                        const libraryELMFile = zip.file(`${libraryName}.json`);
                        const ELMAsB64 = await libraryELMFile?.async("base64");
                        parsedFhir.content?.push({
                            contentType: 'application/elm+json',
                            data: ELMAsB64
                        });
                    }
                    else {
                        console.log("Could not find JSON ELM for Library");
                        return;
                    }

                    // Import the library
                    const newLib = SageUtils.getCqlExecutionLibraryFromInputLibraryResource(parsedFhir);
                    console.log(newLib);
                    if (newLib) {
                        State.emit("load_library", newLib.library, newLib.url, parsedFhir);
                    }
                });
			}
		}) as EventListener;

		window.document.addEventListener('AHRQSendToSAGE', handler, false)
	
		return () => window.document.removeEventListener("AHRQSendToSAGE", handler)
	}, [])
	
	return (
		<div>
            <iframe width="100%" height="600vh"
                src={"http://localhost:8081/authoring/build/61f03de9a217241d27fc9993"}
            />
		</div>
		);
}

export default AhrqFrame;