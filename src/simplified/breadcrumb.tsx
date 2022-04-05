import React from "react";
import {Navbar, Nav, NavItem, Breadcrumb} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faHomeLgAlt} from  '@fortawesome/pro-solid-svg-icons';
import { useNavigate } from "react-router-dom";


export const Crumb: React.FC = () => {
    
    const navigate = useNavigate();

    return (
        <Breadcrumb>
            
                <Breadcrumb.Item onClick={()=> navigate('/create')} >Select a card type</Breadcrumb.Item>
                <span>test</span>
                <Breadcrumb.Item >Enter what the card does</Breadcrumb.Item>
                <Breadcrumb.Item >Enter when the card is played</Breadcrumb.Item>
                <Breadcrumb.Item >Review and save the card</Breadcrumb.Item>
            
        </Breadcrumb>
    )
}