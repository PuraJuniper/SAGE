import React from "react";
import { Card, Button, ButtonGroup } from "react-bootstrap";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faArrowRightFromBracket, faBars, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CreateCardWorkflow } from "./selectView";
import { AUTHOR_THEN_EXIT_ROUTE } from "./basicView";

interface SidebarProps {
    minimized: boolean,
    setMinimized: (newVal: boolean) => void,
}

const Sidebar = ({ minimized, setMinimized }: SidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    return (
        <>
            <div id="sage-sidebar" className={`position-fixed top-0 vh-100 border-end border-2 ${minimized ? "minimized" : ""}`} >
                <Button id="sage-sidebar-fixed-hamburger" className={`sage-sidebar-hamburger ${minimized ? "minimized" : ""}`} variant="sage-white-secondary" onClick={() => setMinimized(!minimized)} >
                    <FontAwesomeIcon icon={faBars} />
                </Button>
                <div id="sage-sidebar-content" className={`d-flex flex-column ${minimized ? "minimized" : ""}`}>
                    <Button className="sage-sidebar-hamburger align-self-end" variant="sage-white-secondary" onClick={() => setMinimized(true)} >
                        <FontAwesomeIcon icon={faXmark} />
                    </Button>
                    <div className="left-nav-button-group">
                        <Button variant="sage-white-secondary" active={location.pathname.startsWith('/basic-home')} className="left-nav-button" onClick={() => navigate('/basic-home')}>Home</Button>
                        <Button variant="sage-white-secondary" active={location.pathname.startsWith('/create')} className="left-nav-button" onClick={() => CreateCardWorkflow(navigate)}>Create Card</Button>
                        <Button variant="sage-white-secondary" active={location.pathname.startsWith('/author')} className="left-nav-button" onClick={() => navigate(`/${AUTHOR_THEN_EXIT_ROUTE}`)}>Authoring Information</Button>
                        <Button variant="sage-white-secondary" active={location.pathname.startsWith('/view-cards')} className="left-nav-button" onClick={() => navigate('/view-cards')}>Saved Cards</Button>
                    </div>
                    <p className="hline"></p>
                    <div className="left-nav-button-group">
                        <Button className="left-nav-button" variant="sage-white-secondary" disabled onClick={() => CreateCardWorkflow(navigate)}>
                            <FontAwesomeIcon icon={faGear} />
                            {" APP SETTINGS"}
                        </Button>
                        <Button className="left-nav-button" variant="sage-white-secondary" disabled onClick={() => navigate('/')}>
                            <FontAwesomeIcon icon={faArrowRightFromBracket} />
                            {" Sign Out"}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )

}

export default React.memo(Sidebar);
