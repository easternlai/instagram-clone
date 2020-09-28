import React, {Fragment} from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import Register from "./Register/Register";
import Login from "./Login/Login";
import Home from "./home/Home";

const AppRoutes = () => (
    <div>
        <Fragment>
          <Route exact path="/" component={Login} />
          <Switch>
            <Route exact path="/register" component={Register} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/home" component={Home} />
          </Switch>
        </Fragment>
    </div>
);

export default AppRoutes;