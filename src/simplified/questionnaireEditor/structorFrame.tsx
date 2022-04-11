import React from 'react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Questionnaire } from "fhir/r4";
import _ from "lodash";

export enum SAGEMessageID {
    TriggerSend = "SAGETriggerSend",
    SendToStructor = "SAGESendToStructor",
}
export interface SAGESendToStructorMsg {
    msgId: SAGEMessageID.SendToStructor,
    questionnaireResource: Questionnaire,
}
export interface SAGETriggerSendMsg {
    msgId: SAGEMessageID.TriggerSend,
}

export enum StructorMessageID {
    Ready = "StructorReady",
    SendToSAGE = "StructorSendToSAGE",
}
export interface StructorReadyMsg {
    msgId: StructorMessageID.Ready,
    readyType: "start" | "load",
}
export interface StructorSendToSAGEMsg {
    msgId: StructorMessageID.SendToSAGE,
    questionnaireStr: string,
}

export interface StructorFrameRef {
	throttledTriggerStructorSend: () => void;
}

interface StructorFrameProps {
	questionnaireFromSage: Questionnaire, // Questionnaire to import into Structor on load
	questionnaireSavedCallback: (arg0: Questionnaire) => boolean, // Callback when Structor initiates a save event
	structorReadyCallback: (arg0: StructorReadyMsg['readyType']) => void,
}

const StructorFrame = forwardRef<StructorFrameRef, StructorFrameProps>(function StructorFrame(props, ref) {
	const [structorFullyLoaded, setStructorFullyLoaded] = useState<boolean>(false);

	const structorIFrameRef = useRef<HTMLIFrameElement>(null);
	useImperativeHandle(ref, () => ({
		throttledTriggerStructorSend: _.throttle(() => {
			if (structorFullyLoaded) {
				console.log("Sage: sending trigger send event");
				const triggerSendEvent: SAGETriggerSendMsg = {
					msgId: SAGEMessageID.TriggerSend,
				}
				console.log(structorIFrameRef.current?.contentWindow?.postMessage(triggerSendEvent, "*"));
			}
		}, 1000),
	}), [structorFullyLoaded])

	// Capture ready event from Structor
	const { structorReadyCallback } = props;
	useEffect(() => {
		const readyEventHandler = ((event: MessageEvent<StructorReadyMsg>) => {
			console.log(event);
			if (event.data.msgId === StructorMessageID.Ready) {
				console.log('sage: structor ready event');
				if (event.data.readyType === 'start') {
					// Send current Questionnaire resource to Structor
					const sendToStructorMsg: SAGESendToStructorMsg = {
						msgId: SAGEMessageID.SendToStructor,
						questionnaireResource: props.questionnaireFromSage,
					};
					structorIFrameRef.current?.contentWindow?.postMessage(sendToStructorMsg, "*");
					structorReadyCallback(event.data.readyType);
				}
				else if (event.data.readyType === 'load') {
					// Show frame since questionnaire has been loaded
					structorReadyCallback(event.data.readyType);
					setStructorFullyLoaded(true);
				}
			}
		}) as EventListener;

		window.addEventListener("message", readyEventHandler, false)
		console.log('added event listener');
	
		return () => window.removeEventListener("message", readyEventHandler)
	}, [structorReadyCallback, props.questionnaireFromSage])

	// Capture output from Structor
	const { questionnaireSavedCallback } = props;
	useEffect(() => {
		const sendToSAGEMsgHandler = ((event: MessageEvent<StructorSendToSAGEMsg>) => {
			if (event.data.msgId === StructorMessageID.SendToSAGE) {
				console.log(event);
				const questionnaire = JSON.parse(event.data.questionnaireStr) as Questionnaire; // trusting this is a valid Questionnaire
				console.log(questionnaire);
				questionnaireSavedCallback(questionnaire);
			}
		}) as EventListener;

		window.addEventListener("message", sendToSAGEMsgHandler, false)
	
		return () => window.removeEventListener("message", sendToSAGEMsgHandler)
	}, [questionnaireSavedCallback])
	
	return (
		<div>
			{!structorFullyLoaded &&
				<div style={{height: "75vh"}} role="progressbar" aria-label="loading-symbol" className="spinner"><img src="../img/ajax-loader.gif" /></div>}

            <iframe style={{display: structorFullyLoaded ? 'inline' : 'none', border: "none", height: "75vh"}} ref={structorIFrameRef} width="100%"
                src={"https://structor-for-sage.web.app/"}
            />
		</div>
		);
});

export default StructorFrame;