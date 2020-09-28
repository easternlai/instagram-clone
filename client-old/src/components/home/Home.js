import React, {Fragment, useState} from 'react';
import Suggested from '../layouts/suggested/Suggested';

const Home = () => {

return (
    <Fragment>
    <div >
    <div className="row">
            <div className="col-8">
                Home
            </div>
            <div className="col-4">
                <Suggested />
            </div>
        </div>
    </div>

    </Fragment>
)

}

export default Home