import React, {Fragment} from 'react';
import './Header.scss';
import HeaderLogo from './HeaderLogo';
import HeaderTopLinks from './HeaderTopLinks';

const Header = () => {

    return (
        <Fragment>
        <div className="container my-3 bg-light">
            <div className="row">
                <div className="col-2">

                </div>
                <div className="col-6">
                    <div className="">
                    <HeaderLogo />
                    </div>
                    <div className="">
                       <input type="text" className="bg-light search-bar"/>
                    </div>
                    
                </div>
                <div className="col-4">
                    <div className="">
                    <HeaderTopLinks />
                    <span className="ml-5">User Name</span>
                    </div>
                    
                </div>
            </div>

        </div>
        </Fragment>
    );

}

export default Header;