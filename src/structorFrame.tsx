import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Questionnaire } from "fhir/r4";

// // Events from Structor
export interface StructorSendToSAGEEvData {
    questionnaireStr: string
}
export const StructorSendToSAGEEvName = "StructorSendToSAGE"
export type StructorSendToSAGEEv = CustomEvent<StructorSendToSAGEEvData>;

export interface StructorReadyEvNameData {
    readyType: "start" | "load"
}
export const StructorReadyEvName = "StructorReady";
export type StructorReadyEv = CustomEvent<StructorReadyEvNameData>;

// // Events to Structor
export interface SAGESendToStructorEvData {
    questionnaireResource: Questionnaire // Hope this is the same as @types/fhir/r4 which is used by SAGE
}
export const SAGESendToStructorEvName = "SAGESendToStructor";
export type SAGESendToStructorEv = CustomEvent<SAGESendToStructorEvData>;

export const SAGETriggerSendEvName = "SAGETriggerSend";
export type SAGETriggerSendEv = CustomEvent<unknown>;

export interface StructorFrameRef {
	triggerStructorSend: () => void;
}

interface StructorFrameProps {
	questionnaireFromSage: Questionnaire, // Questionnaire to import into Structor on load
	questionnaireSavedCallback: (arg0: Questionnaire) => boolean, // Callback when Structor initiates a save event
	structorReadyCallback: (arg0: StructorReadyEvNameData) => void,
}

const StructorFrame = forwardRef<StructorFrameRef, StructorFrameProps>(function StructorFrame(props, ref) {
	const [structorFullyLoaded, setStructorFullyLoaded] = useState<boolean>(false);

	const structorIFrameRef = useRef<HTMLIFrameElement>(null);
	useImperativeHandle(ref, () => ({
		triggerStructorSend: () => {
			if (structorFullyLoaded) {
				console.log("Sage: sending trigger send event");
				const sendToStructorEvent = new CustomEvent(SAGETriggerSendEvName)
				console.log(structorIFrameRef.current?.contentDocument?.dispatchEvent(sendToStructorEvent));
			}
		}
	}), [structorFullyLoaded])

	// Capture ready event from Structor
	const { structorReadyCallback } = props;
	useEffect(() => {
		const readyEventHandler = ((event: StructorReadyEv) => {
			console.log('sage: structor ready event');
			if (event.detail.readyType == 'start') {
				// Send current Questionnaire resource to Structor
				const sendToStructorEvent = new CustomEvent<SAGESendToStructorEvData>(SAGESendToStructorEvName, {
					detail: {
						questionnaireResource: props.questionnaireFromSage
					}
				})
				structorIFrameRef.current?.contentDocument?.dispatchEvent(sendToStructorEvent);
				structorReadyCallback(event.detail);
			}
			else if (event.detail.readyType == 'load') {
				// Show frame since questionnaire has been loaded
				structorReadyCallback(event.detail);
				setStructorFullyLoaded(true);
			}
		}) as EventListener;

		window.document.addEventListener(StructorReadyEvName, readyEventHandler, false)
	
		return () => window.document.removeEventListener(StructorReadyEvName, readyEventHandler)
	}, [structorReadyCallback, props.questionnaireFromSage])

	// Capture output from Structor
	const { questionnaireSavedCallback } = props;
	useEffect(() => {
		const handler = ((event: StructorSendToSAGEEv) => {
			console.log(event);
            const questionnaire = JSON.parse(event.detail.questionnaireStr) as Questionnaire; // trusting this is a valid Questionnaire
            console.log(questionnaire);
			questionnaireSavedCallback(questionnaire);
		}) as EventListener;

		window.document.addEventListener(StructorSendToSAGEEvName, handler, false)
	
		return () => window.document.removeEventListener(StructorSendToSAGEEvName, handler)
	}, [questionnaireSavedCallback])
	
	return (
		<div>
			{!structorFullyLoaded &&
				<div style={{height: "75vh"}} role="progressbar" aria-label="loading-symbol" className="spinner"><img src="../img/ajax-loader.gif" /></div>}

            <iframe style={{display: structorFullyLoaded ? 'inline' : 'none', border: "none", height: "75vh"}} ref={structorIFrameRef} width="100%"
                src={"./structor"}
            />
		</div>
		);
});

export default StructorFrame;