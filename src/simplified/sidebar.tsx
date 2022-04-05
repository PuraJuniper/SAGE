import React from "react";
import { Card, Button, ButtonGroup } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faArrowRightFromBracket} from '@fortawesome/pro-solid-svg-icons';

const Sidebar = () => {
    const params = useParams();
    console.log(params);
    const navigate = useNavigate();
    if (window.location.pathname.includes("/edit/")) {
        return (
            <div style={{flex: "0 0 20%", height: "100vh"}}>
                <Card body style={{height: "100%"}}>
                    <div className="left-nav-button-group">
                        <Button className="left-nav-button">Authoring Information</Button>
                        <Button className="left-nav-button">Choose Activity Type</Button>
                        <Button className="left-nav-button">What does the card do?</Button>
                        <Button className="left-nav-button">When is the card played?</Button>
                        <Button className="left-nav-button">Review Card</Button>
                    </div>
                    <p className="hline"></p>
                    <div  className="left-nav-button-group">
                        <Button className="left-nav-button" onClick={() => navigate('/basic-home')}>Home Page</Button>
                        <Button className="left-nav-button" onClick={() => navigate('/create')}>Create Card</Button>
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
                        <Button className={(window.location.pathname == '/basic-home' ? "left-nav-button highlighted" : "left-nav-button")} onClick={() => navigate('/basic-home')}>Home Page</Button>
                        <Button className={(window.location.pathname == '/create' ? "left-nav-button highlighted" : "left-nav-button")} onClick={() => navigate('/create')}>Create Card</Button>
                        <Button className={(window.location.pathname == '/view-cards' ? "left-nav-button highlighted" : "left-nav-button")} onClick={() => navigate('/view-cards')}>View Cards</Button>
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
