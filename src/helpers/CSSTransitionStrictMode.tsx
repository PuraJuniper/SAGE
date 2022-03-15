import React, { useRef, useState } from "react";
import CSSTransition, { CSSTransitionProps } from "react-transition-group/CSSTransition";
import Overlay, { OverlayChildren, Placement } from "react-bootstrap/esm/Overlay";

type CSSTransitionStrictModeProps = CSSTransitionProps & {
    children: React.ReactElement | React.ReactPortal; // Only allows a single element since CSSTransition errors out when given multiple
}
/** 
 * react-transition-group's CSSTransition triggers warnings in React's strict mode due usage of findDOMNode, so we need our own version
 * https://github.com/reactjs/react-transition-group/issues/668 (react-transition-group will not remove the findDOMNode usage)
 */
export const CSSTransitionStrictMode: React.FunctionComponent<CSSTransitionStrictModeProps> = ({ children, ...props }) => {
    const nodeRef = React.useRef(null);

    return (
      <CSSTransition
        nodeRef={nodeRef}
        {...props}
      >
        <>
            {React.cloneElement(children, { ref: nodeRef })}
        </>
      </CSSTransition>
    );
};
  
interface HoverOverlayProps {
    overlay: OverlayChildren,
    placement: Placement,
    children: React.ReactElement, // Hover needs to be triggered on a single element
    className?: string, // For the wrapper div
}
/**
 * Sort of like react-bootstrap's OverlayTrigger but with ref forwarding (this is needed if it's being nested under CSSTransitionStrictMode)
 * https://github.com/react-bootstrap/react-bootstrap/issues/5023 (OverlayTrigger will not accept a ref)
 */
export const HoverOverlay = React.forwardRef<HTMLDivElement, HoverOverlayProps>(function HoverOverlay(props, ref) {
    const hoverTargetRef = useRef(null);
    const [showOverlay, setShowOverlay] = useState(false);
    
    return (
        <div ref={ref} className={props.className} onMouseOver={() => setShowOverlay(true)} onMouseOut={() => setShowOverlay(false)} >
            {React.cloneElement(props.children, { ref: hoverTargetRef })}
            <Overlay target={hoverTargetRef.current} show={showOverlay} placement={props.placement}>
                {props.overlay}
            </Overlay>
        </div>
    );
})
