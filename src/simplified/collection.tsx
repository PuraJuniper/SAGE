import {useState, useEffect} from "react";
import {Folder} from"./folder";
import State from "../state";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faDownload, faCaretLeft} from  '@fortawesome/pro-solid-svg-icons';


const Collection = (props:any) => {

    const resources = State.get().bundle?.resources ?? [];

    return (
        <div style={{marginTop:"50px"}}>
            <div className="row">
            <h3 className="col-lg-10 col-md-9" style={{color:"#2a6b92"}}><b>Saved Resources</b></h3>
            <button className="navigate-reverse col-lg-2 col-md-3" 
                    onClick={() => State.get().set("ui", {status:"cards"})}>
            <FontAwesomeIcon icon={faCaretLeft} />
                            &nbsp;New Resource
            </button>
            </div>
            <div className="row box">
                {
                resources.map(
                        (resource, i) => {
                        return <div className="col-lg-3 col-md-4 col-sm-6" key={i}>
                            <Folder 
                            actTitle={resource.title}
                            type={resource.meta.profile[0].split("-")[1] ?? resource.resourceType}
                            wait={i*25} 
                            index={i}
                            />
                        </div>
                })
            } 
            </div>
        </div>
    );
}

export default Collection