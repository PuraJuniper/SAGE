import React, { createContext, useEffect, useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Footer from "../footer";
import NavbarFred from "../navbar";
import Collection from "./collection";
import Sidebar from "./sidebar";
import { Header } from "./header";
import { PlanDefLoader } from "./planDefLoader";
import SelectView from "./selectView"
import State, { StateVars, SageFreezerNode } from "../state";

export const StateContext = createContext<SageFreezerNode<StateVars>>(State.get());
export const UiContext = createContext<SageFreezerNode<StateVars['ui']>>(State.get().ui);
export const BundleContext = createContext<SageFreezerNode<StateVars['bundle']>>(State.get().bundle);

export const BasicView = () => {
    const [freezerState, setFreezerState] = useState<SageFreezerNode<StateVars>>(() => State.get());
    const [freezerUi, setFreezerUi] = useState<SageFreezerNode<StateVars['ui']>>(() => State.get().ui);
    const [freezerBundle, setFreezerBundle] = useState<SageFreezerNode<StateVars['bundle']>>(() => State.get().bundle);

    // Subscribe to freezer state changes so that we may update the respective contexts
    useEffect(() => {
        const stateChange = () => {
            setFreezerState(State.get());
            setFreezerUi(State.get().ui);
            setFreezerBundle(State.get().bundle);
        };
        State.on('update', stateChange);

        return () => {
            State.off('update', stateChange);
        }
    })


    const basicViewLayout: JSX.Element = (
        <div id="basic-view-container">
            <StateContext.Provider value={freezerState}>
                <UiContext.Provider value={freezerUi}>
                    <BundleContext.Provider value={freezerBundle}>
                        <Header />
                        <div style={{display: "flex"}} >
                            <Sidebar />
                            <div style={{flexGrow: 1, margin: "50px"}}> {/* Adding this margin helps deal with certain bootstrap classes that use negative margin values */}
                                <Outlet />
                            </div>
                        </div>
                        <Footer />
                    </BundleContext.Provider>
                </UiContext.Provider>
            </StateContext.Provider>
        </div>
    )

    return (
        <Routes>
            <Route element={basicViewLayout}>
                <Route path="create" element={<SelectView />} />
                <Route path="edit/:planDefPos" element={<PlanDefLoader />} />
                <Route index element={<Collection />} />
                <Route path="*" element={<Collection />} /> {/* Fall back to collection view if no other path matches */}
            </Route>
        </Routes>
    );
}
