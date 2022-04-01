import React from "react";
import { Card } from "react-bootstrap";
import { useParams } from "react-router-dom";

const Sidebar = () => {
    const params = useParams();
    console.log(params);

    return (
        <div style={{width: "250px", height: "100vh"}}>
            <Card body style={{height: "100%"}}>
                sample sidebar
            </Card>
        </div>
    )
}

export default React.memo(Sidebar);
