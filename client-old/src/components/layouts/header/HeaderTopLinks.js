import React, {Fragment} from 'react';
import {Link, Redirect} from 'react-router-dom';

const HeaderTopLinks = () => {
    return (
        <Fragment>
            <Link to="/">
                Notifications
            </Link>
        </Fragment>
    )
}

export default HeaderTopLinks;