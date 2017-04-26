const router = require('express').Router();
const encrypt = require('./../utils/encrypt');
const User = require('mongoose').model('User');
const Role = require('mongoose').model('Role');




/* REGISTER */
const registerGet = function(req, res) {
  return res.render('register');
};

const registerPost = function(req, res) {
  return User.findOne({email: req.body.email}, function(error, user) {
    if(error) {
      console.log(error);
      return res.render('register', {info: 'Database error'});
    }
    //if email is taken
    if(user)
      return res.render('register', {info: 'Email is already used'});

    return User.findOne({username: req.body.username}, function(error, user) {
      if(error) {
        console.log(error);
        return res.render('register', {info: 'Database error'});
      }
      //if username is taken
      if(user)
        return res.render('register', {info: 'Username is already used'});

      //if passwords don't match
      if(!(req.body.password === req.body.repeatedPassword))
        return res.render('register', {info: 'Passwords don\'t match'});
      
      //if image is uploaded
      if(req.files.image) {
        req.files.image.mv(`./public/images/${req.files.image.name}`, function(error) {
          if(error){
            console.log(error);
            return res.render('register', {info: 'Cant move img'});
          }
        });
      }

      const img = req.files.image || {name: 'default.jpg'};
      const salt = encrypt.generateSalt(); 
      const passwordHash = encrypt.hashPassword(req.body.password, salt);

      //for the role
      return Role.findOne({name: 'User'}, function(error, role) {
        if(error) {
          console.log(error);
          return res.render('register', {info: 'Database error'});
        }

        const userObject = {
          email: req.body.email,
          passwordHash: passwordHash,
          username: req.body.username,
          articles: [],
          roles: [role.id],
          salt: salt,
          profileImage: `/images/${img.name}`
        };

        //create user
        return User.create(userObject, function(error, user) {
          if(error) {
            console.log(error);
            return res.render('register', {info: 'Database error'});
          }

          //save user to User role
          role.users.push(user.id);
          role.save(function(error) {
            if(error) {
              console.log(error);
              return res.render('register', {info: 'Database error'});
            }
            //success
            return res.render('register', {info: 'Successfuly registered'});
          });
        });
      });
    });
  });
};




/* ROUTER */
router.get('/', registerGet);
router.post('/', registerPost);




module.exports = router;
