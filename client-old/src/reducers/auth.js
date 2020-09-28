const initialState = {
    user: null,
    isAuthenticated: null
}

export default function (state = initialState, action) {
    const {type, payload} = action;

    switch(type){

        case 'USER_LOADED':
            return {
                ...state, user: payload, isAuthenticated: true
            }

        case 'LOGIN_SUCCESS':
            localStorage.setItem('token', payload.token)
            return {
                ...state, ...payload, isAuthenicated: true}

        default:
            return state
    }
}
