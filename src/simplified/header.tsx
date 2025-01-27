import React from "react";
import {Navbar, Nav, NavItem} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faHomeLgAlt} from  '@fortawesome/pro-solid-svg-icons';
import { useNavigate } from "react-router-dom";
import logo from "../../public/img/WhiteSAGELogo-colour.png";


export const Header: React.FC = () => {
    
    const navigate = useNavigate();

    return (
        <Navbar sticky="top" className="navbar-custom">
            <Navbar.Brand>         
            <img src={logo} style={{height: 30}}/> Basic
            </Navbar.Brand>
			<Nav.Link key='home-button' onClick={() => navigate('/basic-home')}>
			<FontAwesomeIcon key="butSaveIcon" icon={faHomeLgAlt} style={{'color':'white','height':'30px','marginRight':'3rem'}} />
			</Nav.Link>
        </Navbar>
    )
}
