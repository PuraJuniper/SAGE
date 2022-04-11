import React from "react";
import { Card, Button, ButtonGroup } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faArrowRightFromBracket} from '@fortawesome/pro-solid-svg-icons';

interface SidebarProps {
    pageType: string, 
    pageTitle: any
}

const Sidebar = (props: SidebarProps) => {
    const params = useParams();
    const navigate = useNavigate();
    if (props.pageType === 'create card') {
        return (
            <div style={{flex: "0 0 20%", height: "100vh"}}>
                <Card body style={{height: "100%"}}>
                    <div className="left-nav-button-group">
                        <Button className={(props.pageTitle == 'Authoring Information' ? "left-nav-button highlighted" : "left-nav-button")}>Authoring Information</Button>
                        <Button className={(props.pageTitle == 'What Is The Card Type?' ? "left-nav-button highlighted" : "left-nav-button")}>What Is The Card Type?</Button>
                        <Button className={(props.pageTitle == 'What does the card do?' ? "left-nav-button highlighted" : "left-nav-button")}>What does the card do?</Button>
                        <Button className={(props.pageTitle == 'When is the card played?' ? "left-nav-button highlighted" : "left-nav-button")}>When is the card played?</Button>
                        <Button className={(props.pageTitle == 'Review card' ? "left-nav-button highlighted" : "left-nav-button")}>Review Card</Button>
                    </div>
                    <p className="hline"></p>
                    <div  className="left-nav-button-group">
                        <Button className="left-nav-button" onClick={() => navigate('/basic-home')}>Home</Button>
                        <Button className="left-nav-button" onClick={() => navigate('/author')}>Create Card</Button>
                        <Button className="left-nav-button" onClick={() => navigate('/view-cards')}>View Cards</Button>
                    </div>
                    <p className="hline"></p>
                    <div className="left-nav-button-group">
                        <Button className="left-nav-button" onClick={() => navigate('/create')}>
                            <FontAwesomeIcon icon={faGear}/>
                            {" APP SETTINGS"}</Button>
                        <Button className="left-nav-button" onClick={() => navigate('/')}>
                            <FontAwesomeIcon icon={faArrowRightFromBracket}/>
                            {" Sign Out"}</Button>
                    </div>
                </Card>
            </div>
        )
    } 
    if (props.pageType === 'questionaire') {
        return (
            <div style={{flex: "0 0 20%", height: "100vh"}}>
                <Card body style={{height: "100%"}}>
                    <div className="left-nav-button-group">
                        <Button className={(props.pageTitle == 'Authoring Information' ? "left-nav-button highlighted" : "left-nav-button")}>Authoring Information</Button>
                        <Button className={(props.pageTitle == 'Page 1: Creating a Questionnaire' ? "left-nav-button highlighted" : "left-nav-button")}>Page 1: Creating a Questionnaire</Button>
                        <Button className={(props.pageTitle == 'Page 2: Adding Conditions' ? "left-nav-button highlighted" : "left-nav-button")}>Page 2: Adding Conditions</Button>
                        <Button className={(props.pageTitle == 'Page 3: Card Preview' ? "left-nav-button highlighted" : "left-nav-button")}>Page 3: Card Preview</Button>
                    </div>
                    <p className="hline"></p>
                    <div  className="left-nav-button-group">
                        <Button className="left-nav-button" onClick={() => navigate('/basic-home')}>Home</Button>
                        <Button className="left-nav-button" onClick={() => navigate('/author')}>Create Card</Button>
                        <Button className="left-nav-button" onClick={() => navigate('/view-cards')}>View Cards</Button>
                    </div>
                    <p className="hline"></p>
                    <div className="left-nav-button-group">
                        <Button className="left-nav-button" onClick={() => navigate('/create')}>
                            <FontAwesomeIcon icon={faGear}/>
                            {" APP SETTINGS"}</Button>
                        <Button className="left-nav-button" onClick={() => navigate('/')}>
                            <FontAwesomeIcon icon={faArrowRightFromBracket}/>
                            {" Sign Out"}</Button>
                    </div>
                </Card>
            </div>
        )
    } 
    else {
        return (
            <div style={{flex: "0 0 20%", height: "100vh"}}>
                <Card body style={{height: "100%"}}>
                    <div  className="left-nav-button-group">
                        <Button className={(window.location.pathname == '/basic-home' ? "left-nav-button highlighted" : "left-nav-button")} onClick={() => navigate('/basic-home')}>Home</Button>
                        <Button className={(window.location.pathname == '/create' ? "left-nav-button highlighted" : "left-nav-button")} onClick={() => navigate('/author')}>Create Card</Button>
                        <Button className={(props.pageTitle == 'Saved Cards' ? "left-nav-button highlighted" : "left-nav-button")} onClick={() => navigate('/view-cards')}>View Cards</Button>
                    </div>
                    <p className="hline"></p>
                    <div className="left-nav-button-group">
                        <Button className="left-nav-button" onClick={() => navigate('/create')}>
                            <FontAwesomeIcon icon={faGear}/>
                            {" APP SETTINGS"}</Button>
                        <Button className="left-nav-button" onClick={() => navigate('/')}>
                            <FontAwesomeIcon icon={faArrowRightFromBracket}/>
                            {" Sign Out"}</Button>
                    </div>
                </Card>
            </div>
        )
    }
}

export default React.memo(Sidebar);
