import React, {Fragment} from 'react';
import {Link} from 'react-router-dom';
import SidebarLink from './SidebarLink';


const Sidebar = () => {

    return (
        <Fragment>
        <ul className="nav flex-column position-fixed">
            <SidebarLink link="/home" label="User Name"/>
        </ul>
        </Fragment>
    )
}

export default Sidebar;