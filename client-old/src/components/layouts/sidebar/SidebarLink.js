import React from 'react';
import {Link} from 'react-router-dom';

const SidebarLink = ({link, label}) => {

    return(
        <li className="nav-item">
            <Link to={link}>{label}</Link>
        </li>
    );

}

export default SidebarLink;