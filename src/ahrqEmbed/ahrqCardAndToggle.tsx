import { useEffect, useRef, useState } from "react";
import { Card, Button } from "react-bootstrap";
import AhrqFrame, { AhrqFrameRef } from "./ahrqFrame";
import State from "../state";

export default function AhrqCardAndToggle() {
    const [show, setShow] = useState<boolean>(false);
    const [showAlert, setShowAlert] = useState<boolean>(false); // Show some sort of alert on the button that indicates an update from the editor frame
    const ahrqRef = useRef<AhrqFrameRef>(null);

    useEffect(() => {
        State.on("open_ahrq_artifact", (ahrqId) => {
            const success = ahrqRef.current?.openArtifactId(ahrqId) || false;
            if (success) {
                setShowAlert(true);
                setShow(true);
            }
            return success;
        });

        return () => {
            State.off("open_ahrq_artifact");
        };
    }, []);

    // Clear alert if ahrq frame is open
    useEffect(() => {
        if (show) {
            setShowAlert(false);
        }
    }, [show, showAlert]);

    const buttonText = "CQL Editor";
    const buttonInner = <span>{buttonText}{showAlert ? "(!)" : undefined}</span>

    // Card display is set to 'none' to prevent it from being unmounted (we want the ahrq frame minimized, not closed)
    return (
        <div>
            <div 
                style={{
                    display: show ? 'inline' : 'none',
                    position: "fixed",
                    bottom: "47px",
                    right: "0.5in",
                    width: "94vw",
                }}
            >
                <Card border="ahrq">
                    <Card.Header
                        className="card-header-ahrq"
                        onClick={() => setShow(false)}
                    >
                        Editor Homepage
                    </Card.Header>
                    <Card.Body bsPrefix="card-body-ahrq">
                        <AhrqFrame ref={ahrqRef}/>
                    </Card.Body>
                </Card>
            </div>
            <Button
                style={{
                    position: "fixed",
                    bottom: "0px",
                    right: "1in"
                }} 
                variant="ahrq" size="lg"
                active={show}
                onClick={() => setShow(!show)}
            >
                {show ? buttonInner : <i>{buttonInner}</i>}
            </Button>
        </div>
    );
}