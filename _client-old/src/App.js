import React, { Fragment } from "react";
import "./App.scss";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import { Provider } from "react-redux";

import Header from './components/layouts/header/Header';
import Sidebar from './components/layouts/sidebar/Sidebar';
import AppRoutes from './components/AppRoutes';

import store from "./store";

function App() {
  return (
    <Provider store={store}>
      <Router>
      <div className="app">
        <Header />
      </div>
      <div className="row bg-light page">
        <div className="col-4">
          <Sidebar/>
        </div>
        <div className="col-8">
        <AppRoutes />
        </div>
      </div>

      </Router>
    </Provider>
  );
}

export default App;
