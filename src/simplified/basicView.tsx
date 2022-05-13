import React, { createContext, useEffect, useState } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import Footer from "../footer";
import NavbarFred from "../navbar";
import Collection from "./collection";
import Sidebar from "./sidebar";
import { Header } from "./header";
import { PlanDefLoader } from "./planDefLoader";
import SelectView from "./selectView"
import BasicHomeView from "./home"
import State, { StateVars, SageFreezerNode } from "../state";
import Authoring from "./authoringInfo";

export const StateContext = createContext<SageFreezerNode<StateVars>>(State.get());
export const UiContext = createContext<SageFreezerNode<StateVars['ui']>>(State.get().ui);
export const BundleContext = createContext<SageFreezerNode<StateVars['bundle']>>(State.get().bundle);

export const AUTHOR_THEN_EXIT_ROUTE = "author"
export const AUTHOR_THEN_CARD_ROUTE = "create-first"

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
                        <div>
                            <Outlet />
                        </div>
                    </BundleContext.Provider>
                </UiContext.Provider>
            </StateContext.Provider>
        </div>
    )

    return (
        <Routes>
            <Route element={basicViewLayout}>
                <Route path="basic-home" element={<BasicHomeView />} />
                <Route path={AUTHOR_THEN_EXIT_ROUTE} element={<Authoring continueToCreateCard={false}/>} /> 
                <Route path={AUTHOR_THEN_CARD_ROUTE} element={<Authoring continueToCreateCard={true}/>} />
                <Route path="create" element={<SelectView />} />
                <Route path="edit/:planDefPos" element={<PlanDefLoader />} />
                <Route index element={<Collection />} />
                <Route path="view-cards" element={<Collection />} /> {/* Fall back to collection view if no other path matches */}
            </Route>
        </Routes>
    );
}
