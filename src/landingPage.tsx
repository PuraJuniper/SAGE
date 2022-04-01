import React from "react";
import State from "./state";

export const LandingPage = () => {
    
    return (
        <div>
            <button 
                onClick={() => {
                    State.get().bundle?.set("resources", []);
                    State.get().set("mode", "basic")
                }}
            >
                Basic CPG
            </button>
            <button 
                onClick={() => {
                    State.get().ui.set("status", "advanced-cpg");
                    State.get().set("mode", "advanced");
                }}
            >
                Advanced CPG
            </button>
        </div>
    );
}
