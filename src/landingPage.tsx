import React from "react";
import State from "./state";

export const LandingPage = () => {
    
    return (
        <div className="container">
            <div className="row justify-content-md-center" style={{marginBottom: 40}}>
                <div className="col-lg-1"></div>
                <div className="col-lg-2 ">
                    <img src="../img/Juniper-CDS-colour.png" className="img-thumbnail"/>
                </div>
                <div className="col-lg-1"></div>
            </div>
            <div className="row justify-content-md-center">
                <div className="col col-lg-1 bg-secondary"></div>
                <div className="col-lg-2 bg-secondary text-center">
                    <p style={{marginTop: 60}}><span style={{color: "#E0C758", textAlign: "center", fontWeight: "bold"}}>Choose Account</span></p>
                </div>
                <div className="col col-lg-1 bg-secondary"></div>
            </div>
            <div className="row justify-content-md-center">
                <div className="col-lg-1 bg-secondary"></div>
                <div className="col-lg-2 bg-secondary">
                    <button className="btn btn-secondary btn-block" style={{marginTop: 60}} onClick={(e) => {
                            State.get().bundle?.set("resources", []);
                            State.get().set("mode", "basic")
                        }}>
                        Basic CPG
                    </button>
                </div>
                <div className="col-lg-1 bg-secondary" ></div>
            </div>
            <div className="row justify-content-md-center">
                <div className="col-lg-1 bg-secondary"></div>
                <div className="col-lg-2 bg-secondary">
                    <button className="btn btn-secondary btn-block" style={{marginTop: 10, marginBottom: 100}} onClick={(e) => {
                        State.get().ui.set("status", "advanced-cpg");
                        State.get().set("mode", "advanced");
                    }}>
                        Advanced CPG
                    </button>
                </div>
                <div className="col-lg-1 bg-secondary"></div>
            </div>
        </div>
    );
}
