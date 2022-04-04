import React from "react";
import State from "./state";
import { useNavigate } from "react-router-dom";
import {Navbar, Nav, NavItem} from 'react-bootstrap';

export const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <Navbar className="navbar-custom"><Navbar.Brand>SAGE Basic</Navbar.Brand></Navbar>
            <div className="container">
                <div className="row justify-content-md-center" style={{ marginTop: 40, marginBottom: 40 }}>
                    <div className="col-lg-1"></div>
                    <div className="col-lg-2 ">
                        <img src="../img/Juniper-CDS-colour.png" className="img-thumbnail" />
                    </div>
                    <div className="col-lg-1"></div>
                </div>
                <div className="row justify-content-md-center">
                    <div className="col col-lg-1 bg-secondary"></div>
                    <div className="col-lg-2 bg-secondary text-center">
                        <p style={{ marginTop: 60 }}><span style={{ color: "#E0C758", textAlign: "center", fontWeight: "bold" }}>Choose Account</span></p>
                    </div>
                    <div className="col col-lg-1 bg-secondary"></div>
                </div>
                <div className="row justify-content-md-center">
                    <div className="col-lg-1 bg-secondary"></div>
                    <div className="col-lg-2 bg-secondary">
                        <button className="btn btn-secondary btn-block" style={{ marginTop: 60 }} onClick={(e) => {
                            State.get().bundle?.set("resources", []);
                            State.get().set("mode", "basic");
                            navigate('/basic-home');
                        } }>
                            Basic CPG
                        </button>
                    </div>
                    <div className="col-lg-1 bg-secondary"></div>
                </div>
                <div className="row justify-content-md-center">
                    <div className="col-lg-1 bg-secondary"></div>
                    <div className="col-lg-2 bg-secondary">
                        <button className="btn btn-secondary btn-block" style={{ marginTop: 10, marginBottom: 100 }} onClick={(e) => {
                            State.get().ui.set("status", "advanced-cpg");
                            State.get().set("mode", "advanced");
                        } }>
                            Advanced CPG
                        </button>
                    </div>
                    <div className="col-lg-1 bg-secondary"></div>
                </div>
            </div>
        </>
    );
}
