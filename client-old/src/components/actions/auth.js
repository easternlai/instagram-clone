import axios from 'axios';
import setAuthToken from '../utils/setAuthToken';

export const loadUser = () => async dispatch => {
    if(localStorage.token) {
        setAuthToken(localStorage.token);
    }

    try {

        const res = await axios.get('api/auth');

        dispatch({
            type: "USER_LOADED",
            payload: res.data
        });
        
    } catch (err) {
        dispatch({
            type: 'AUTH_ERROR'
        })
        
    }
}

export const register = ({name, email, password }) => async(dispatch) => {
    try {

        const res = await axios.post('/api/users', {name, email, password});

        dispatch({
            type: 'REGISTER_SUCCESS',
            payload: res.data
        })
        dispatch(loadUser());

    } catch (err) {
        console.log("register error");
        const errors = err.response.data.errors;
        dispatch({
            type: 'REGISTER_FAIL',
        });
    }
}

export const login = ({email, password}) => async (dispatch) => {
    try {

        const res = await axios.post ('/api/auth', {email, password});
        
        dispatch({
            type: 'LOGIN_SUCCESS',
            payload: res.data
        });
   
        dispatch(loadUser());
        
    } catch (err) {
        const errors = err.response.data.errors;
        dispatch({
            type: 'REGISTER_FAIL',
        });
    }

}

