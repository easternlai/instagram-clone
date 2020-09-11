const express = require("express");
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require("express-validator/check");

const User = require('../../models/User');

//@route POST api/users
//@desc Registers user
//@ACCESS Public

router.post(
    '/',
    [
        check("name", "Name is required").not().isEmpty(),
        check("email", "Please use a valid email address").isEmail(),
        check("password", "Please enter a password with 6 or more characters").isLength({min: 6})
    ],
    async (req, res) => {

        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }

        const {name, email, password} = req.body;

        try {

            let user = await User.findOne({email});

            if(user){
                return res.status(400).json({errors: [{msg: "User already exist"}]});
            }

            user = new User ({
                name,
                email,
                password
            });

            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            user.save();

            //Create json webtoken
            payload = {
                user: {
                    id: user.id
                }
            }
            jwt.sign(
                payload,
                config.get('jwtSecret'),
                {expiresIn: '2 days'},
                (err, token) => {
                    if (err) throw err; 
                    res.json({token});
                }
            );
        } catch (err) {
            console.log(err.message);
            res.status(500).send("Server error");
        }

    }
);

module.exports = router;