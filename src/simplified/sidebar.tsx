import React from "react";
import { Card, Button, ButtonGroup } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear, faArrowRightFromBracket} from '@fortawesome/pro-solid-svg-icons';

const Sidebar = () => {
    const params = useParams();
    console.log(params);
    const navigate = useNavigate();

    return (
        <div style={{flex: "0 0 20%", height: "100vh"}}>
            <Card body style={{height: "100%"}}>
                <div className="left-nav-button-group">
                    <Button className="left-nav-button" onClick={() => navigate('/basic-home')}>Home Page</Button>
                    <Button className="left-nav-button" onClick={() => navigate('/basic-home')}>Authoring Information</Button>
                    <Button className="left-nav-button" onClick={() => navigate('/basic-home')}>Choose Activity Type</Button>
                    <Button className="left-nav-button" onClick={() => navigate('/basic-home')}>What does the card do?</Button>
                    <Button className="left-nav-button" onClick={() => navigate('/basic-home')}>When is the card played?</Button>
                    <Button className="left-nav-button" onClick={() => navigate('/basic-home')}>Review Card</Button>
                </div>
                <div  className="left-nav-button-group left-nav-button-group-middle">
                    <Button className="left-nav-button" onClick={() => navigate('/create')}>Create Card</Button>
                    <Button className="left-nav-button" onClick={() => navigate('/')}>View Cards</Button>
                </div>
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

export default React.memo(Sidebar);
