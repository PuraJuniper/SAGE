import React, { useEffect, useState } from "react";
import { BrowserRouter, Link, Outlet, Route, Routes } from "react-router-dom";
import { LandingPage } from "./landingPage";
import RootComponent from "./RootComponent";
import { BasicView } from "./simplified/basicView";
import State, { SageMode, StateVars } from "./state";

export default function App() {
    // Holdover from FRED: force a re-render every time the freezer-js state changes
    // const [_, forceUpdate] = useState<StateVars>(State.get());
    useEffect(() => {
        // State.on("update", (state) => {
        //     forceUpdate(state)
        // })
    }, []);

    // SAGE loads some necessary data asynchronously after the first render
    const [isSageLoading, setIsSageLoading] = useState(true);
    useEffect(() => {
        const sageLoadingListener = (newUi: StateVars['ui']) => setIsSageLoading(newUi.status === "loading_sage_data");
        State.get().ui.getListener().on("update", sageLoadingListener);

        // Load necessary profiles, etc for SAGE to function
        State.emit("load_initial_json", "profiles/cpg.json", "", false);

        return () => { State.get().ui.getListener().off('update', sageLoadingListener); }
    }, [])

    // Store mode (basic/advanced)
    const [sageMode, setSageMode] = useState<SageMode>();
    useEffect(() => {
        const updateMode = (newState: StateVars) => setSageMode(newState.mode);
        State.on("update", updateMode)

        return () => { State.off("update", updateMode); }
    });

    // Warn user of unsaved changes if a bundle has been created
    useEffect(() => {
        const warnUnsaved = (e: BeforeUnloadEvent) => {
            if (State.get().bundle.resources.length !== 0) {
                e.preventDefault();
                const warningText = "If you leave this page you will lose any unsaved changes.";
                e.returnValue = warningText;
                return warningText;
            }
        }
        window.addEventListener('beforeunload', warnUnsaved, { capture: true });
        
        return () => window.removeEventListener('beforeunload', warnUnsaved, { capture: true });
    }, []);

    // Return element based on mode
    const baseElement: JSX.Element = (() => {
        if (isSageLoading) { // (Still loading necessary data)
            return <div role="progressbar" aria-label="loading-symbol" className="spinner"><img src="../img/ajax-loader.gif" /></div>;
        }
        
        if (sageMode === undefined) {
            return <LandingPage />
        }
        else if (sageMode === "basic") {
            return <BasicView /> // new ui
        }
        else {
            return <RootComponent /> // classic view
        }
    })()

    return (
        <BrowserRouter>
            <Routes>
                <Route path="*" element={baseElement} />
            </Routes>
        </BrowserRouter>
    );
}
