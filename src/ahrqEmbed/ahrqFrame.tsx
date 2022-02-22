import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import JSZip from "jszip";
import { Library } from "fhir/r4";
import * as SageUtils from "../helpers/sage-utils";
import State from "../reactions";

interface AHRQOutput {
    libraryName: string,
    libraryAhrqId: string,
    libraryZip: Blob,
}

const SAGEOpenArtifactEvName = "SAGEOpenArtifact";
interface SAGEOpenArtifactEvData {
    id: string
}

export interface AhrqFrameRef {
    openArtifactId: (id: string) => boolean,
}

interface AhrqFrameProps {
    paused?: boolean
}

const AhrqFrame = forwardRef<AhrqFrameRef, AhrqFrameProps>(function AhrqFrame(props, ref) {
	const [ahrqFullyLoaded, setahrqFullyLoaded] = useState<boolean>(true);

	const ahrqIFrameRef = useRef<HTMLIFrameElement>(null);
	useImperativeHandle(ref, () => ({
		openArtifactId: (id) => {
			if (ahrqFullyLoaded) {
				console.log(`Sage: sending open artifact event for id ${id}`);
				const openArtifactEvent = new CustomEvent<SAGEOpenArtifactEvData>(SAGEOpenArtifactEvName, {
                    detail: {
                        id: id
                    }
                });
				return ahrqIFrameRef.current?.contentDocument?.dispatchEvent(openArtifactEvent) || false;
			}
            return false;
		}
	}), [ahrqFullyLoaded])

	useEffect(() => {
		const handler = ((event: CustomEvent<AHRQOutput>) => {
			console.log(event);
            try { // Catching any errors since the AHRQ code is complex and not type-checked
                if (event.detail) {
                    // console.log('time');
                    // const date = Date.now();
                    // let currentDate = null;
                    // do {
                    //     currentDate = Date.now();
                    // } while (currentDate - date < 2000);
                    // console.log('time end');
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
                            State.emit("load_library", newLib.library, newLib.url, parsedFhir, event.detail.libraryAhrqId);
                        }
                    });
                }
            }
            catch {
                console.log("Error - Invalid data received from AHRQ CQL Authoring Tool");
                return;
            }
            }) as EventListener;
            
            window.document.addEventListener('AHRQSendToSAGE', handler, false)
            
            return () => window.document.removeEventListener("AHRQSendToSAGE", handler)
        }, [])
        
        return (
		<div>
			{!ahrqFullyLoaded &&
                <div style={{height: "75vh"}} role="progressbar" aria-label="loading-symbol" className="spinner"><img src="../img/ajax-loader.gif" /></div>}

            <iframe style={{display: ahrqFullyLoaded ? 'inline' : 'none', border: "none", height: "75vh"}} ref={ahrqIFrameRef} width="100%"
                src={"./authoring/artifacts"}
            />
		</div>
		);
});

export default AhrqFrame;