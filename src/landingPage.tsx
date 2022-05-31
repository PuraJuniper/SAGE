import React from "react";
import State from "./state";
import { useNavigate } from "react-router-dom";
import { Navbar, Nav, NavItem, Button } from 'react-bootstrap';
import logo from "../public/img/WhiteSAGELogo-colour.png"

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <Navbar className="navbar-custom"><Navbar.Brand>
                <img src={logo} style={{height: 30}}/>
            </Navbar.Brand></Navbar>
            <div className="container">
                <div className="row justify-content-md-center" style={{ marginTop: 40, marginBottom: 40 }}>
                    <div className="col-lg-2 ">
                        <img src="/img/Juniper-CDS-colour.png" className="img-thumbnail" style={{ border: 0 }} />
                    </div>
                </div>
            </div>
            <div className="container bg-sage-darkpurple" style={{ width: 500 }}>
                <div className="row justify-content-md-center" >
                    <div className="col text-center">
                        <p style={{ marginTop: 60 }}><span style={{ color: "#E0C758", textAlign: "center", fontWeight: "bold" }}>Choose Account</span></p>
                    </div>
                </div>
                <div className="row justify-content-md-center">
                    <div className="col-lg-2" style={{ width: "40%"}}>
                        <Button variant="secondary" bsPrefix="landing-page-btn btn" onClick={(e) => {
                            State.get().bundle?.set("resources", []);
                            State.get().set("mode", "basic");
                            navigate('/basic-home');
                        } }>
                            Basic CPG
                        </Button>
                    </div>
                </div>
                <div className="row justify-content-md-center" >
                    <div className="col-lg-2" style={{ marginBottom: 60, width: "40%"}}>
                        <Button variant="secondary" bsPrefix="landing-page-btn btn" onClick={(e) => {
                            State.get().ui.set("status", "advanced-cpg");
                            State.get().set("mode", "advanced");
                        } }>
                            Advanced CPG
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
