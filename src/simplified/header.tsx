import React from "react";
import { Navbar } from "react-bootstrap";

export const Header: React.FC = () => {
    return (
        <Navbar sticky="top" className="navbar-custom">
            <Navbar.Brand>
                Forking FRED
            </Navbar.Brand>
        </Navbar>
    )
}
