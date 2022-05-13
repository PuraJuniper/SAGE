import React from "react";
import { Card, Button, ButtonGroup } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faArrowRightFromBracket } from '@fortawesome/pro-solid-svg-icons';
import { CreateCardWorkflow } from "./selectView";
import { AUTHOR_THEN_EXIT_ROUTE } from "./basicView";

interface SidebarProps {
    pageType: string,
    pageTitle: any
}

const Sidebar = (props: SidebarProps) => {
    const params = useParams();
    const navigate = useNavigate();
    return (
        <>
            <div id="sage-sidebar-placeholder" /> {/* Empty div so that the sidebar's shape exists in the main document flow */}
            <div id="sage-sidebar" className="position-fixed top-0 start-0 vh-100 border-end border-2">
                <div id="sage-sidebar-content" className="d-flex flex-column">
                    {(() => {
                        if (props.pageType === 'create card') {
                            return (
                                <>
                                    <div className="left-nav-button-group">
                                        <Button className="left-nav-button" onClick={() => navigate('/basic-home')}>Home</Button>
                                        <Button className="left-nav-button" onClick={() => CreateCardWorkflow(navigate)}>Create Card</Button>
                                        <Button className="left-nav-button" onClick={() => navigate(`/${AUTHOR_THEN_EXIT_ROUTE}`)}>Authoring Information</Button>
                                        <Button className="left-nav-button" onClick={() => navigate('/view-cards')}>View Cards</Button>
                                    </div>
                                    <p className="hline"></p>
                                    <div className="left-nav-button-group">
                                        <Button className="left-nav-button" onClick={() => CreateCardWorkflow(navigate)}>
                                            <FontAwesomeIcon icon={faGear} />
                                            {" APP SETTINGS"}</Button>
                                        <Button className="left-nav-button" onClick={() => navigate('/')}>
                                            <FontAwesomeIcon icon={faArrowRightFromBracket} />
                                            {" Sign Out"}</Button>
                                    </div>
                                </>
                            )
                        }
                        if (props.pageType === 'questionaire') {
                            return (
                                <>
                                    <div className="left-nav-button-group">
                                        <Button className={(props.pageTitle == 'Authoring Information' ? "left-nav-button highlighted" : "left-nav-button")}>Authoring Information</Button>
                                        <Button className={(props.pageTitle == 'Page 1: Creating a Questionnaire' ? "left-nav-button highlighted" : "left-nav-button")}>Page 1: Creating a Questionnaire</Button>
                                        <Button className={(props.pageTitle == 'Page 2: Adding Conditions' ? "left-nav-button highlighted" : "left-nav-button")}>Page 2: Adding Conditions</Button>
                                        <Button className={(props.pageTitle == 'Page 3: Card Preview' ? "left-nav-button highlighted" : "left-nav-button")}>Page 3: Card Preview</Button>
                                    </div>
                                    <p className="hline"></p>
                                    <div className="left-nav-button-group">
                                        <Button className="left-nav-button" onClick={() => navigate('/basic-home')}>Home</Button>
                                        <Button className="left-nav-button" onClick={() => CreateCardWorkflow(navigate)}>Create Card</Button>
                                        <Button className="left-nav-button" onClick={() => navigate('/view-cards')}>View Cards</Button>
                                    </div>
                                    <p className="hline"></p>
                                    <div className="left-nav-button-group">
                                        <Button className="left-nav-button" onClick={() => CreateCardWorkflow(navigate)}>
                                            <FontAwesomeIcon icon={faGear} />
                                            {" APP SETTINGS"}</Button>
                                        <Button className="left-nav-button" onClick={() => navigate('/')}>
                                            <FontAwesomeIcon icon={faArrowRightFromBracket} />
                                            {" Sign Out"}</Button>
                                    </div>
                                </>
                            )
                        }
                        else {
                            return (
                                <>
                                    <div className="left-nav-button-group">
                                        <Button className={(window.location.pathname == '/basic-home' ? "left-nav-button highlighted" : "left-nav-button")} onClick={() => navigate('/basic-home')}>Home</Button>
                                        <Button className={(window.location.pathname == '/create' ? "left-nav-button highlighted" : "left-nav-button")} onClick={() => CreateCardWorkflow(navigate)}>Create Card</Button>
                                        <Button className="left-nav-button" onClick={() => navigate(`/${AUTHOR_THEN_EXIT_ROUTE}`)}>Authoring Information</Button>
                                        <Button className={(props.pageTitle == 'Saved Cards' ? "left-nav-button highlighted" : "left-nav-button")} onClick={() => navigate('/view-cards')}>View Cards</Button>
                                    </div>
                                    <p className="hline"></p>
                                    <div className="left-nav-button-group">
                                        <Button className="left-nav-button" onClick={() => CreateCardWorkflow(navigate)}>
                                            <FontAwesomeIcon icon={faGear} />
                                            {" APP SETTINGS"}</Button>
                                        <Button className="left-nav-button" onClick={() => navigate('/')}>
                                            <FontAwesomeIcon icon={faArrowRightFromBracket} />
                                            {" Sign Out"}</Button>
                                    </div>
                                </>
                            )
                        }
                    })()}
                </div>
            </div>
        </>
    )

}

export default React.memo(Sidebar);
